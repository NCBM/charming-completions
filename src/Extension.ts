// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import { DotCompletionProvider } from './DotCompletion';
import { log } from './Logger';
import { makeReExport } from './ReExport';
import { TreeSitterDocument } from './DocumentParser';

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export async function activate(context: vscode.ExtensionContext) {
	// let channel = vscode.window.createOutputChannel("Charming Completions", { log: true });
	// channel.show();

	await TreeSitterDocument.getInstance().initTreeSitter();

	const dotProvider = new DotCompletionProvider();

	dotProvider.addFunctionCompletionName("print");
	dotProvider.addFunctionCompletionName("repr");
	dotProvider.addFunctionCompletionName("id");
	dotProvider.addFunctionCompletionName("hash");
	dotProvider.addFunctionCompletionName("len");
	dotProvider.addFunctionCompletionName("abs");
	dotProvider.addFunctionCompletionName("sum");
	dotProvider.addFunctionCompletionName("round");
	dotProvider.addFunctionCompletionName("str");
	dotProvider.addFunctionCompletionName("int");
	dotProvider.addFunctionCompletionName("float");
	dotProvider.addFunctionCompletionName("bool");
	dotProvider.addFunctionCompletionName("type");
	dotProvider.addFunctionCompletionName("list");

	dotProvider.addKeywordCompletionName("assert");
	dotProvider.addKeywordCompletionName("await");
	dotProvider.addKeywordCompletionName("del");
	dotProvider.addKeywordCompletionName("raise");
	dotProvider.addKeywordCompletionName("return");
	dotProvider.addKeywordCompletionName("yield");

	const dotCompletion = dotProvider.makeCompletionProvider();
	const reExportCompletion = makeReExport();


    context.subscriptions.push(dotCompletion, reExportCompletion);

	log.info('"Charming Completions" is now active!');
}

// This method is called when your extension is deactivated
export function deactivate() {}
