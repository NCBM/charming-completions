import assert from 'assert';
import * as vscode from 'vscode';
import { log } from './Logger';
import { TreeSitterDocument } from './DocumentParser';


const getBeforeDotPosition = (document: vscode.TextDocument, position: vscode.Position) => {
    let line = position.line;
    let beforeDot = document.lineAt(line).text;
    let dotColumn = beforeDot.lastIndexOf("."); // Find the last dot 
    if (dotColumn === -1) {
        return new vscode.Position(line, 0);
    }
    return new vscode.Position(line, dotColumn);
};


export class DotCompletionProvider {
    dotFunctionCompletionNames: vscode.CompletionItem[];
    dotKeywordCompletionNames: vscode.CompletionItem[];
    dotASTDocument: TreeSitterDocument = TreeSitterDocument.getInstance();

    addFunctionCompletionName(name: string) {
        let completion = new vscode.CompletionItem(name, vscode.CompletionItemKind.Snippet);
        completion.documentation = new vscode.MarkdownString(`Inserts a \`${name}(...)\` statement with the object or variable before the cursor.`);
        completion.insertText = "";
        this.dotFunctionCompletionNames.push(completion);
    }

    addKeywordCompletionName(name: string) {
        let completion = new vscode.CompletionItem(name, vscode.CompletionItemKind.Snippet);
        completion.documentation = new vscode.MarkdownString(`Inserts a \`${name} ...\` statement with the object or variable before the cursor.`);
        completion.insertText = "";
        this.dotKeywordCompletionNames.push(completion);
    }

    makeCompletionProvider() {
        let fncompnames = this.dotFunctionCompletionNames;
        let kwcompnames = this.dotKeywordCompletionNames;
        let dotASTDocument = this.dotASTDocument;
        return vscode.languages.registerCompletionItemProvider("python", {
            provideCompletionItems(document, position) {

                let path = document.uri.toString();

                let pos = getBeforeDotPosition(document, position);
                

                /// TODO: dynamic update document 
                dotASTDocument.parse(path, document.getText(new vscode.Range(new vscode.Position(0, 0), pos))
                );
        
                let node = dotASTDocument.findNodeInEndPosition(path, {
                    row: pos.line,
                    column: pos.character 
                });

                if (node === null) {
                    return [];
                }
                let range = new vscode.Range(
                    new vscode.Position(node.startPosition.row, node.startPosition.column),
                    new vscode.Position(node.endPosition.row, node.endPosition.column)
                );

                log.trace(`Find Node: ${node}`);
                log.trace(`${range.start.line} ${range.start.character} ${range.end.line} ${range.end.character}`);
                const target = document.getText(range);

                let compitems: vscode.CompletionItem[] = [];

                for (let i = 0; i < fncompnames.length; i++) {
                    fncompnames[i].detail = `${fncompnames[i].label}(${target})`;
                    let edit = new vscode.TextEdit(range.with({ end: position }), `${fncompnames[i].label}(${target})`);
                    fncompnames[i].additionalTextEdits = [edit];
                    compitems.push(fncompnames[i]);
                }

                for (let i = 0; i < kwcompnames.length; i++) {
                    kwcompnames[i].detail = `${kwcompnames[i].label} ${target}`;
                    let edit = new vscode.TextEdit(range.with({ end: position }), `${kwcompnames[i].label} ${target}`);
                    kwcompnames[i].additionalTextEdits = [edit];
                    compitems.push(kwcompnames[i]);
                }

                let foreachCompletion = new vscode.CompletionItem("foreach", vscode.CompletionItemKind.Snippet);
                foreachCompletion.insertText = new vscode.SnippetString("for ${1:i} in " + target + ":$0");
                foreachCompletion.documentation = new vscode.MarkdownString(`Inserts a \`for i in ...:\` statement with the object or variable before the cursor.`);
                foreachCompletion.detail = `for i in ${target}:`;
                let foreachCompletionEdit = new vscode.TextEdit(range.with({ end: position }), "");
                foreachCompletion.additionalTextEdits = [foreachCompletionEdit];
                compitems.push(foreachCompletion);

                let foriCompletion = new vscode.CompletionItem("fori", vscode.CompletionItemKind.Snippet);
                foriCompletion.insertText = new vscode.SnippetString("for ${1:i}, ${2:elem} in enumerate(" + target + "):$0");
                foriCompletion.documentation = new vscode.MarkdownString(`Inserts a \`for i, elem in enumerate(...):\` statement with the object or variable before the cursor.`);
                foriCompletion.detail = `for i, elem in ${target}:`;
                let foriCompletionEdit = new vscode.TextEdit(range.with({ end: position }), "");
                foriCompletion.additionalTextEdits = [foriCompletionEdit];
                compitems.push(foriCompletion);

                let aforeachCompletion = new vscode.CompletionItem("aforeach", vscode.CompletionItemKind.Snippet);
                aforeachCompletion.insertText = new vscode.SnippetString("async for ${1:i} in " + target + ":$0");
                aforeachCompletion.documentation = new vscode.MarkdownString(`Inserts a \`async for i in ...:\` statement with the object or variable before the cursor.`);
                aforeachCompletion.detail = `async for i in ${target}:`;
                let aforeachCompletionEdit = new vscode.TextEdit(range.with({ end: position }), "");
                aforeachCompletion.additionalTextEdits = [aforeachCompletionEdit];
                compitems.push(aforeachCompletion);

                // let aforiCompletion = new vscode.CompletionItem("afori", vscode.CompletionItemKind.Snippet);
                // aforiCompletion.insertText = new vscode.SnippetString("for ${1:i}, ${2:elem} in enumerate(" + target + "):$0");
                // aforiCompletion.documentation = new vscode.MarkdownString(`Inserts a \`for i, elem in enumerate(...):\` statement with the object or variable before the cursor.`);
                // aforiCompletion.detail = `for i, elem in ${target}:`;
                // let aforiCompletionEdit = new vscode.TextEdit(range.with({ end: position }), "");
                // aforiCompletion.additionalTextEdits = [aforiCompletionEdit];
                // compitems.push(aforiCompletion);

                return compitems;
            }
        }, ".");
    }

    constructor() {
        this.dotFunctionCompletionNames = [];
        this.dotKeywordCompletionNames = [];
    }
};