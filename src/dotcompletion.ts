import assert from 'assert';
import * as vscode from 'vscode';
import { log } from './logoutput';

const simpleExprRegExp = /([FfRrBbUu]?\"(\\\"|[^\"])*\"|\'(\\\'|[^\'])*\')(\s*\\?\s*[FfRrBbUu]?\"(\\\"|[^\"])*\"|\'(\\\'|[^\'])*\')*|\d*(_?\d+)*\.?\d+(_?\d+)*([eE][+-]?\d+(_?\d+)*)?\b|0([Bb][01]+(_?[01]+)*|[Oo][0-7]+(_?[0-7]+)*|[Xx][0-9A-Fa-f]+(_?[0-9A-Fa-f]+)*)|([a-zA-Z_]\w*)(\.[a-zA-Z_]\w*)*/gm;
const pythonKeywords = [
    "and", "as", "assert", "async", "await", "break", "class", "continue", "def", "del", "elif", "else", "except",
    "finally", "for", "from", "global", "if", "import", "in", "is", "lambda", "nonlocal", "not", "or", "pass",
    "raise", "return", "try", "while", "with", "yield"
];

function countPrecedingBackslashes(str: string, charIndex: number): number {
    // If the character index is out of bounds or negative, return 0.
    if (charIndex < 0 || charIndex >= str.length) {
        return 0;
    }

    let backslashCount = 0;
    // Walk backwards from the given character index and count '\'.
    for (let i = charIndex - 1; i >= 0; i--) {
        if (str[i] === '\\') {
            backslashCount++;
        } else {
            // Stop counting when a non-backslash character is encountered.
            break;
        }
    }

    return backslashCount;
}

function findFirstHashOutsideQuotes(currentText: string): number | null {
    let inQuote = false;
    let quoteChar: string | null = null;

    for (let i = 0; i < currentText.length; i++) {
        const char = currentText[i];
        if ((char === '"' || char === "'") && (i === 0 || currentText[i-1] !== '\\')) {
            // Toggle the inQuote state and remember which quote type we are in.
            if (!inQuote) {
                quoteChar = char;
                inQuote = true;
            } else if (quoteChar === char) {
                inQuote = false;
                quoteChar = null;
            }
        } else if (char === '#' && !inQuote) {
            return i; // Return the position of the first hash outside quotes
        }
    }

    return null; // Return null if no hash is found outside quotes
}

function getExpressionRange(document: vscode.TextDocument, position: vscode.Position) {
    let end = position.translate(0, -1);
    let simpleExprEnd = end;
    let symStack: string[] = [];

    let lastText = document.lineAt(position).text.slice(0, position.character - 1);
    let lastParen = lastText.lastIndexOf(")");
    let lastBrket = lastText.lastIndexOf("]");
    let lastBrace = lastText.lastIndexOf("}");

    if (lastParen !== -1 || lastBrket !== -1 || lastBrace !== -1) {
        let lastCh = (lastParen > lastBrket) ? (lastParen) : (lastBrket);
        lastCh = (lastCh > lastBrace) ? (lastCh) : (lastBrace);
        lastText = lastText.slice(0, lastCh + 1);
        block: for (let line = position.line; line >= 0; line--) {
            let inString: "\"" | "'" | null = null;
            let currentLine = document.lineAt(position.with(line, 0));
            let currentText = (line === position.line) ? lastText : currentLine.text;
            let hashOutside = (inString === null) ? findFirstHashOutsideQuotes(currentText) : null;
            if (hashOutside !== null) {
                currentText = currentText.slice(0, hashOutside);
            }
            log.trace(`Processing line: '${currentText}'`);
            for (let idx = currentText.length - 1; idx >= 0; idx--) {
                log.trace(symStack.toString());
                const ch = currentText[idx];
                if (inString === null && ")]}\"'".indexOf(ch) !== -1) {
                    if (ch === "\"" || ch === "'") { inString = ch; }
                    else { symStack.push(ch); }
                    continue;
                }
                if (inString === null && "([{".indexOf(ch) !== -1) {
                    switch (symStack.pop()) {
                        case ")":
                            assert(ch === "(");
                            break;
                        case "]":
                            assert(ch === "[");
                            break;
                        case "}":
                            assert(ch === "{");
                            break;
                        default:
                            log.error("Brackets matching failed.");
                            break;
                    }
                    if (symStack.length === 0) {
                        simpleExprEnd = simpleExprEnd.with(line, idx);
                        break block;
                    }
                }
                if (inString !== null && ch === inString) {
                    if ((countPrecedingBackslashes(currentText, idx) & 1) === 1) { continue; }
                    inString = null;
                }
            }
        }
    }

    let range = document.getWordRangeAtPosition(simpleExprEnd, simpleExprRegExp);
    if (range === undefined) {
        return new vscode.Range(simpleExprEnd, end);
    }
    return range.with({ end: end });
}

export class DotCompletionProvider {
    dotFunctionCompletionNames: vscode.CompletionItem[];
    dotKeywordCompletionNames: vscode.CompletionItem[];

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
        return vscode.languages.registerCompletionItemProvider("python", {
            provideCompletionItems(document, position) {
                let _range;
                if ((_range = document.getWordRangeAtPosition(position)) !== undefined) {
                    position = _range.start;
                }
                let range = getExpressionRange(document, position);
                while (range.with(getExpressionRange(document, position).start) !== range) {
                    range = range.with(getExpressionRange(document, position).start);
                }
                log.debug(`${range.start.line} ${range.start.character} ${range.end.line} ${range.end.character}`);
                const target = document.getText(range);
                if (pythonKeywords.includes(target.trim())) {
                    return null;
                }

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