import * as vscode from 'vscode';
import { log } from './Logger';

export function makeReExport() {
    return vscode.languages.registerCompletionItemProvider("python", {
        provideCompletionItems(document, position) {
            if (!document.getText(document.getWordRangeAtPosition(position)).startsWith("a")) {
                return null;
            }
            if (document.lineAt(position).text.length < 3) {
                return null;
            }
            let idx = document.lineAt(position).text.slice(0, position.character - 2).trimEnd().length;
            let dline;
            for (dline = 0; idx === 0 && position.line - dline >= 0; dline++) {
                log.trace(document.lineAt(position.line - dline).text.trimEnd());
                idx = document.lineAt(position.line - dline).text.trimEnd().length;
            }
            let nameRange = document.getWordRangeAtPosition(position.translate(-dline).with({ character: idx - 1 }));
            log.trace(`Name range matched: -${dline} ${idx} => ${position.line - dline} ${idx - 1}`);
            if (nameRange === undefined) {
                return null;
            }
            let name = document.getText(nameRange);
            log.trace(`Name matched: ${name}`);
            let item = new vscode.CompletionItem("as", vscode.CompletionItemKind.Snippet);
            item.keepWhitespace = true;
            item.insertText = `as ${name}`;
            item.detail = `(re-export) as ${name}`;
            item.documentation = "A shortcut for re-exporting.";
            return [item];
        },
    }, "a", "s");
}