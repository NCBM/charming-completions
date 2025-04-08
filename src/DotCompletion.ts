import * as vscode from 'vscode';
import { TreeSitterDocument } from './DocumentParser';
import { log } from './Logger';


const getBeforeDotPosition = (document: vscode.TextDocument, position: vscode.Position) => {
    let line = position.line;
    let beforeDot = document.lineAt(line).text;
    let dotColumn = beforeDot.lastIndexOf("."); // Find the last dot 
    if (dotColumn === -1) {
        return new vscode.Position(line, 0);
    }
    return new vscode.Position(line, dotColumn);
};


const makeCompletionSnippet = (name: string, snippet: { left: string, right: string }, brief: string, target: string, replaceRange: vscode.Range) => {
    let completion = new vscode.CompletionItem(name, vscode.CompletionItemKind.Snippet);
    completion.insertText = new vscode.SnippetString(snippet.left + target + snippet.right);
    completion.documentation = new vscode.MarkdownString(`Inserts a \`${brief}\` statement with the object or variable before the cursor.`);
    completion.detail = brief;
    let completionEdit = new vscode.TextEdit(replaceRange, "");
    completion.additionalTextEdits = [completionEdit];
    return completion;
};


export class DotCompletionProvider {
    dotFunctionCompletionNames: vscode.CompletionItem[];
    dotKeywordCompletionNames: vscode.CompletionItem[];
    dotMultiValueFunctionCompletionNames: vscode.CompletionItem[];
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

    addMultiValueFunctionCompletionName(name: string) {
        let completion = new vscode.CompletionItem(name, vscode.CompletionItemKind.Snippet);
        completion.documentation = new vscode.MarkdownString(`Inserts a \`${name}(...)\` statement with the object or variable before the cursor.`);
        completion.insertText = "";
        this.dotMultiValueFunctionCompletionNames.push(completion);
    }

    makeCompletionProvider() {
        let fncompnames = this.dotFunctionCompletionNames;
        let kwcompnames = this.dotKeywordCompletionNames;
        let mvfncompnames = this.dotMultiValueFunctionCompletionNames;
        let dotASTDocument = this.dotASTDocument;
        return vscode.languages.registerCompletionItemProvider("python", {
            provideCompletionItems(document, position) {
                let path = document.uri.toString();

                let pos = getBeforeDotPosition(document, position);
                let wrange = document.getWordRangeAtPosition(position);

                /// TODO: dynamic update document 
                dotASTDocument.parse(path, (
                    document.getText(new vscode.Range(new vscode.Position(0, 0), pos))
                    + document.getText(new vscode.Range(
                        wrange !== undefined ? wrange.end : pos.translate({ characterDelta: 1 }), document.lineAt(document.lineCount - 1).range.end
                    ))
                ));

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

                for (let i = 0; i < mvfncompnames.length; i++) {
                    mvfncompnames[i].detail = `${mvfncompnames[i].label}(${target})`;
                    mvfncompnames[i].insertText = new vscode.SnippetString(`${mvfncompnames[i].label}(${target}$1)$0`);
                    let edit = new vscode.TextEdit(range.with({ end: position }), "");
                    mvfncompnames[i].additionalTextEdits = [edit];
                    compitems.push(mvfncompnames[i]);
                }

                let foreachCompletion = makeCompletionSnippet("foreach", { left: "for ${1:i} in ", right: ":$0" }, "for i in ...:", target, range.with({ end: position }));
                let foriCompletion = makeCompletionSnippet("forenum", { left: "for ${1:i}, ${2:elem} in enumerate(", right: "):$0" }, "for i, elem in enumerate(...):", target, range.with({ end: position }));
                let aforeachCompletion = makeCompletionSnippet("aforeach", { left: "async for ${1:i} in ", right: ":$0" }, "async for i in ...:", target, range.with({ end: position }));
                let comprehensionCompletion = makeCompletionSnippet("comp", { left: "${2:expr} for ${1:i} in ", right: "$0" }, "expr for i in ...", target, range.with({ end: position }));
                let asyncComprehensionCompletion = makeCompletionSnippet("acomp", { left: "${2:expr} async for ${1:i} in ", right: "$0" }, "expr async for i in ...", target, range.with({ end: position }));

                compitems.push(foreachCompletion, foriCompletion, aforeachCompletion, comprehensionCompletion, asyncComprehensionCompletion);

                return compitems;
            }
        }, ".");
    }

    constructor() {
        this.dotFunctionCompletionNames = [];
        this.dotKeywordCompletionNames = [];
        this.dotMultiValueFunctionCompletionNames = [];
    }
};