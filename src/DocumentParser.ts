import path from "path";
import { Edit, Language, Node, Parser, Point, Tree } from "web-tree-sitter";

const acceptedGrammarTypes = [
    "expression_statement",
    "keyword_argument",
    "assignment",
    "identifier",
    "string",
    "integer",
    "float",
    "true",
    "false",
    "none",
    "call",
    "list",
    "set",
    "dictionary",
    "tuple",
    "subscript",
    "binary_operator",
    "unary_operator",
    "list_comprehension",
    "dictionary_comprehension",
    "set_comprehension",
];

const eqPoint = (p1: Point, p2: Point) => {
    return p1.column === p2.column && p1.row === p2.row;
};

export class TreeSitterDocument {
    private static instance = new TreeSitterDocument();
    private parser: Parser | null = null;

    private data: Map<String, Tree> = new Map();

    private constructor() {}

    async initTreeSitter() {
        await Parser.init();
        this.parser = new Parser();
        const Lang = await Language.load(
            path.join(__dirname, "tree-sitter-python.wasm")
        );
        this.parser.setLanguage(Lang);
    }

    static getInstance() {
        return this.instance;
    }

    parse(path: string, code: string) {
        if (this.parser === null) {
            throw new Error("Parser is not initialized");
        }
        let tree = this.parser.parse(code);
        if (tree !== null) {
            this.data.set(path, tree);
        }
    }

    update(path: string, change: Edit): boolean {
        if (this.hasPath(path)) {
            this.data.get(path)?.edit(change);
            return true;
        }
        return false;
    }

    getData(path: string): Tree | undefined | null {
        if (this.hasPath(path)) {
            return this.data.get(path);
        }
        return null;
    }

    hasPath(path: string): boolean {
        return this.data.has(path);
    }

    /// Find the node in the end position
    findNodeInEndPosition = (path: string, endPosition: Point) => {
        if (!this.hasPath(path)) {
            return null;
        }
        let node = this.data.get(path)?.rootNode;
        if (node === undefined) {
            return null;
        }
        let stack: Node[] = [node];
        while (stack.length > 0) {
            let node = stack.pop();

            if (node === undefined || node === null) {
                continue;
            }

            // row is greater than the end position
            // column is less than the end position
            if (
                node.endPosition.row < endPosition.row ||
                node.startPosition.column > endPosition.column
            ) {
                continue;
            }

            if (
                eqPoint(endPosition, node.endPosition) &&
                acceptedGrammarTypes.includes(node.grammarType)
            ) {
                /// get the assignment right side
                if (node.grammarType === "expression_statement") {
                    if (node.firstNamedChild?.grammarType === "assignment") {
                        return node.firstNamedChild.lastChild;
                    }
                    /// get expression node
                    return node.firstChild;
                }

                if (node.grammarType === "keyword_argument") {
                    return node.lastChild;
                }
                return node;
            }
            stack.push(
                ...node.namedChildren.filter(
                    (child): child is Node => child !== null
                )
            );
        }
        return null;
    };
}
