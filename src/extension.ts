// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
	let channel = vscode.window.createOutputChannel("Charming Snippets", { log: true });
	// channel.show();
	channel.info('Congratulations, your extension "charming-snippets" is now active!');

	// // The command has been defined in the package.json file
	// // Now provide the implementation of the command with registerCommand
	// // The commandId parameter must match the command field in package.json
	// const testDisposable = vscode.commands.registerCommand('charming-snippets.helloWorld', () => {
	// 	// The code you place here will be executed every time your command is executed
	// 	// Display a message box to the user
	// 	vscode.window.showInformationMessage('Hello World from Charming Snippets!');
	// });

	// context.subscriptions.push(testDisposable);// Register a command that triggers the smart completion

	const dotCompletion = vscode.languages.registerCompletionItemProvider("python", {
		provideCompletionItems(document, position) {
			const target = document.lineAt(position).text.slice(0, position.character - 1);

			let dotPrint = new vscode.CompletionItem("print", vscode.CompletionItemKind.Text);
			dotPrint.detail = `print(${target})`;
			dotPrint.documentation = new vscode.MarkdownString('Inserts a print statement with the object or variable before the cursor.');
			let start = new vscode.Position(position.line, document.lineAt(position).firstNonWhitespaceCharacterIndex);
			dotPrint.insertText = "";
			let edit = new vscode.TextEdit(new vscode.Range(start, position), `print(${target})`);
			dotPrint.additionalTextEdits = [edit];
			return [dotPrint];
		}
	}, ".");

    context.subscriptions.push(dotCompletion);
}

// This method is called when your extension is deactivated
export function deactivate() {}
