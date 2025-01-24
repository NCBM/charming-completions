import * as vscode from 'vscode';
import { log } from './logoutput';

export function makeReExport() {
    return vscode.languages.registerCompletionItemProvider("python", {
        provideCompletionItems(document, position) {
            if (!document.getText(document.getWordRangeAtPosition(position)).startsWith("a")) {
                return null;
            }
            let idx = document.lineAt(position).text.slice(0, position.character - 2).trimEnd().length;
            let dline;
            for (dline = 0; idx === 0; dline++) {
                idx = document.lineAt(position.translate(-dline)).text.slice(0, position.character - 2).trimEnd().length;
            }
            let nameRange = document.getWordRangeAtPosition(position.translate(-dline).with({ character: idx }));
            log.trace(`Name range matched: -${dline} ${idx}`);
            if (nameRange === undefined) {
                return null;
            }
            let name = document.getText(nameRange);
            log.trace(`Name matched: ${name}`);
            let item = new vscode.CompletionItem("as", vscode.CompletionItemKind.Snippet);
            item.keepWhitespace = true;
            item.insertText = `as ${name}`;
            item.detail = `(re-export) ${name}`;
            item.documentation = "A shortcut for re-exporting.";
            return [item];
        },
    }, "a", "s");
}