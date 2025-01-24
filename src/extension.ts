// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import { DotCompletionProvider } from './dotcompletion';
import { log } from './logoutput';

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
	// let channel = vscode.window.createOutputChannel("Charming Completions", { log: true });
	// channel.show();

	const dotProvider = new DotCompletionProvider();

	dotProvider.addCompletionName("print");
	dotProvider.addCompletionName("repr");
	dotProvider.addCompletionName("id");
	dotProvider.addCompletionName("hash");
	dotProvider.addCompletionName("len");
	dotProvider.addCompletionName("abs");
	dotProvider.addCompletionName("sum");
	dotProvider.addCompletionName("round");
	dotProvider.addCompletionName("str");
	dotProvider.addCompletionName("int");
	dotProvider.addCompletionName("float");
	dotProvider.addCompletionName("bool");
	dotProvider.addCompletionName("type");
	dotProvider.addCompletionName("list");

	const dotCompletion = dotProvider.makeCompletionProvider();

    context.subscriptions.push(dotCompletion);

	log.info('"Charming Completions" is now active!');
}

// This method is called when your extension is deactivated
export function deactivate() {}
