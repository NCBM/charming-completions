// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import { TreeSitterDocument } from './DocumentParser';
import { DotCompletionProvider } from './DotCompletion';
import { log } from './Logger';
import { makeReExport } from './ReExport';

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export async function activate(context: vscode.ExtensionContext) {
	await TreeSitterDocument.getInstance().initTreeSitter();

	const dotProvider = new DotCompletionProvider();

	const dotFunctionCompletionNames = ["print", "repr", "id", "hash", "len", "abs", "sum", "round", "str", "int", "float", "bool", "type", "list"];
	const dotKeywordCompletionNames = ["assert", "await", "del", "raise", "return", "yield"];
	dotFunctionCompletionNames.forEach((value) => { dotProvider.addFunctionCompletionName(value); });
	dotKeywordCompletionNames.forEach((value) => { dotProvider.addKeywordCompletionName(value); });

	const dotCompletion = dotProvider.makeCompletionProvider();
	const reExportCompletion = makeReExport();

	context.subscriptions.push(dotCompletion, reExportCompletion);

	log.info('"Charming Completions" is now active!');
}

// This method is called when your extension is deactivated
export function deactivate() { }
