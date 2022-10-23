import * as vscode from "vscode";

import { FormattingEditProvider } from "./features/formatter";
import { Configuration } from "./features/helper/configuration";
import { EXCLUDE_RULE, EXCLUDE_RULE_WORKSPACE, HoverProvider, LinterProvider, QuickFixProvider, VIEW_DOCUMENTATION } from "./features/linter";

export const activate = (context: vscode.ExtensionContext) => {
  Configuration.initialize();
  const linterProvider = new LinterProvider();
  const lintingProvider = linterProvider.activate(context.subscriptions);

  vscode.languages.registerDocumentFormattingEditProvider("sql", new FormattingEditProvider().activate());
  vscode.languages.registerDocumentFormattingEditProvider("sql-bigquery", new FormattingEditProvider().activate());
  vscode.languages.registerDocumentFormattingEditProvider("jinja-sql", new FormattingEditProvider().activate());

  if (!Configuration.osmosisEnabled()) {
    context.subscriptions.push(
      vscode.languages.registerCodeActionsProvider("sql", new QuickFixProvider(), {
        providedCodeActionKinds: QuickFixProvider.providedCodeActionKind
      }),
      vscode.languages.registerCodeActionsProvider("sql-bigquery", new QuickFixProvider(), {
        providedCodeActionKinds: QuickFixProvider.providedCodeActionKind
      }),
      vscode.languages.registerCodeActionsProvider("jinja-sql", new QuickFixProvider(), {
        providedCodeActionKinds: QuickFixProvider.providedCodeActionKind
      })
    );
  }

  context.subscriptions.push(
    vscode.languages.registerHoverProvider("sql", new HoverProvider()),
    vscode.languages.registerHoverProvider("sql-bigquery", new HoverProvider()),
    vscode.languages.registerHoverProvider("jinja-sql", new HoverProvider()),
  );

  context.subscriptions.push(vscode.commands.registerCommand(EXCLUDE_RULE, toggleRule));
  context.subscriptions.push(vscode.commands.registerCommand(EXCLUDE_RULE_WORKSPACE, toggleRuleWorkspace));
  context.subscriptions.push(vscode.commands.registerCommand(VIEW_DOCUMENTATION, showDocumentation));

  const lintCommand = "sqlfluff.lint";
  const lintCommandHandler = () => {
    if (vscode.window.activeTextEditor) {
			const currentDocument = vscode.window.activeTextEditor.document;
      if (currentDocument) {
        lintingProvider.doLint(currentDocument);
      }
    }
  }

  const lintProjectCommand = "sqlfluff.lintProject";
  const lintProjectCommandHandler = () => {
    if (vscode.window.activeTextEditor) {
			const currentDocument = vscode.window.activeTextEditor.document;
      if (currentDocument) {
        lintingProvider.lintProject(true);
      }
    }
  }

  const fixCommand = "sqlfluff.fix";
  const fixCommandHandler = () => {
    if (vscode.window.activeTextEditor) {
			const currentDocument = vscode.window.activeTextEditor.document;
      if (currentDocument) {
        vscode.commands.executeCommand("editor.action.formatDocument")
      }
    }
  }

  context.subscriptions.push(vscode.commands.registerCommand(lintCommand, lintCommandHandler));
  context.subscriptions.push(vscode.commands.registerCommand(lintProjectCommand, lintProjectCommandHandler));
  context.subscriptions.push(vscode.commands.registerCommand(fixCommand, fixCommandHandler));
};

// eslint-disable-next-line @typescript-eslint/no-empty-function
export const deactivate: any = () => { };

function toggleRule(rule: string) {
  const configuration = vscode.workspace.getConfiguration("sqlfluff");
  const excludeRules: any = configuration.inspect("excludeRules");
  const excludeRulesArray = excludeRules.globalValue ?? [];

  if (!excludeRulesArray.includes(rule)) {
    excludeRulesArray.push(rule);
  }

  excludeRulesArray.sort((x: string, y: string) => {
    return parseInt(x.substring(1)) - parseInt(y.substring(1));
  });

  return configuration.update("excludeRules", excludeRulesArray, vscode.ConfigurationTarget.Global);
}

function toggleRuleWorkspace(rule: string) {
  const configuration = vscode.workspace.getConfiguration("sqlfluff");
  const excludeRules: any = configuration.inspect("excludeRules");
  const excludeRulesArray = excludeRules.workspaceValue ?? [];

  if (!excludeRulesArray.includes(rule)) {
    excludeRulesArray.push(rule);
  }

  excludeRulesArray.sort((x: string, y: string) => {
    return parseInt(x.substring(1)) - parseInt(y.substring(1));
  });

  return configuration.update("excludeRules", excludeRulesArray, vscode.ConfigurationTarget.Workspace);
}

function showDocumentation(rule: string) {
  const path = `https://docs.sqlfluff.com/en/stable/rules.html#sqlfluff.rules.Rule_${rule}`;

  return vscode.env.openExternal(vscode.Uri.parse(path));
}
