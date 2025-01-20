import * as vscode from 'vscode';

export class DotCompletionProvider {
    dotCompletionNames: vscode.CompletionItem[];

    addCompletionName(name: string) {
        let completion = new vscode.CompletionItem(name, vscode.CompletionItemKind.Snippet);
        completion.documentation = new vscode.MarkdownString(`Inserts a ${name} statement with the object or variable before the cursor.`);
        completion.insertText = "";
        this.dotCompletionNames.push(completion);
    }

    makeCompletionProvider() {
        let compnames = this.dotCompletionNames;
	    return vscode.languages.registerCompletionItemProvider("python", {
            provideCompletionItems(document, position) {
                const target = document.lineAt(position).text.slice(0, position.character - 1);

                for (let i = 0; i < compnames.length; i++) {
                    compnames[i].detail = `${compnames[i].label}(${target})`;
                    let start = new vscode.Position(position.line, document.lineAt(position).firstNonWhitespaceCharacterIndex);
                    let edit = new vscode.TextEdit(new vscode.Range(start, position), `${compnames[i].label}(${target})`);
                    compnames[i].additionalTextEdits = [edit];
                }

                return compnames;
            }
        }, ".");
    }

    constructor() {
        this.dotCompletionNames = [];
    }
};