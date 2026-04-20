import type { Values } from '../types';
import type {
  Position,
  Hover,
  CompletionItem,
  MarkupContent,
  Diagnostic,
  DocumentSymbol,
  FoldingRange,
  Location,
  SignatureHelp,
  SemanticTokens,
  CodeAction,
  Range,
  TextEdit,
  WorkspaceEdit,
  InlayHint
} from 'vscode-languageserver-types';
import type { FormatOptions } from './formatter/pretty-printer';
import type { TextDocument } from 'vscode-languageserver-textdocument';

/**
 * Public API for the language service
 */
export interface LanguageServiceApi {
    /**
     * Returns a list of possible completions for the given position in the document.
     * @param params - Parameters for the completion request
     */
    getCompletions(params: GetCompletionsParams): CompletionItem[];

    /**
     * Returns a hover message for the given position in the document.
     * @param params - Parameters for the hover request
     */
    getHover(params: GetHoverParams): HoverV2;

    /**
     * Returns a list of syntax highlighting tokens for the given text document.
     * @param textDocument - The text document to analyze
     */
    getHighlighting(textDocument: TextDocument): HighlightToken[];

    /**
     * Returns a list of diagnostics for the given text document.
     * This includes errors like incorrect number of function arguments.
     * @param params - Parameters for the diagnostics request
     */
    getDiagnostics(params: GetDiagnosticsParams): Diagnostic[];

    /**
     * Returns the list of symbols declared or used in the document as LSP
     * DocumentSymbol entries. One entry per unique symbol (dedup by name/kind).
     */
    getDocumentSymbols(params: { textDocument: TextDocument }): DocumentSymbol[];

    /**
     * Returns folding ranges for multi-line constructs (case blocks, multi-line
     * array and object literals).
     */
    getFoldingRanges(params: { textDocument: TextDocument }): FoldingRange[];

    /**
     * Returns the definition location of the identifier at the given position,
     * or null if the position is not on a named symbol. The definition is the
     * first occurrence of the name within the expression.
     */
    getDefinition(params: { textDocument: TextDocument; position: Position }): Location | null;

    /**
     * Returns every occurrence of the identifier at the given position within
     * the expression, including the definition itself.
     */
    getReferences(params: { textDocument: TextDocument; position: Position }): Location[];

    /**
     * Returns signature help for the function call enclosing the given
     * position, or null if the cursor is not inside a recognized call.
     */
    getSignatureHelp(params: { textDocument: TextDocument; position: Position }): SignatureHelp | null;

    /**
     * Returns LSP SemanticTokens for the document, using the stable legend
     * exported from `./semantic-tokens`.
     */
    getSemanticTokens(params: { textDocument: TextDocument }): SemanticTokens;

    /**
     * Returns LSP CodeAction quick fixes for the diagnostics in the supplied
     * context. Currently handles `arity-too-few` (inserts placeholder args),
     * `unknown-ident` (Levenshtein "did you mean" suggestions) and
     * `legacy-arg-order` (reorders dual-order built-in calls to the preferred
     * collection-first form).
     */
    getCodeActions(params: GetCodeActionsParams): CodeAction[];

    /**
     * Format the entire expression document. Returns a single whole-document
     * `TextEdit` when the formatter output differs from the current source,
     * or an empty array when the document parses cleanly and is already
     * formatted (or when it does not parse).
     */
    format(params: FormatParams): TextEdit[];

    /**
     * Returns the range of the renameable symbol at `position`, or null when
     * the cursor is not on a user-defined identifier (e.g. it is on a built-in
     * function name, constant, or keyword). Clients call this before `rename`
     * to confirm the operation is valid and to display the pre-filled rename
     * input filled with the current name.
     */
    prepareRename(params: PrepareRenameParams): Range | null;

    /**
     * Replaces all occurrences of the identifier at `position` with `newName`,
     * including lambda / function-def parameter declarations. Returns null when
     * the cursor is not on a renameable identifier or the document does not
     * parse.
     */
    rename(params: RenameParams): WorkspaceEdit | null;

    /**
     * Returns parameter-name inlay hints for built-in function calls within the
     * optional `range`. Hints are only emitted for functions with two or more
     * documented parameters so single-argument calls stay uncluttered.
     */
    getInlayHints(params: GetInlayHintsParams): InlayHint[];
}

export interface FormatParams {
    textDocument: TextDocument;
    options?: FormatOptions;
}

export interface PrepareRenameParams {
    textDocument: TextDocument;
    position: Position;
}

export interface RenameParams {
    textDocument: TextDocument;
    position: Position;
    newName: string;
}

export interface GetInlayHintsParams {
    textDocument: TextDocument;
    /** Optional viewport range; hints outside it are omitted. */
    range?: Range;
}

export interface GetCodeActionsParams {
    textDocument: TextDocument;
    range: Range;
    context: {
        diagnostics: readonly Diagnostic[];
        variables?: Values;
    };
}

export interface HighlightToken {
    type: 'number' | 'string' | 'name' | 'keyword' | 'operator' | 'function' | 'punctuation' | 'constant' | 'comment';
    start: number;
    end: number;
    value?: string | number | boolean | undefined;
}

export interface LanguageServiceOptions {
    // A map of operator names to booleans indicating whether they are
    // allowed in the expression.
    operators?: Record<string, boolean>;
}

export interface GetCompletionsParams {
    textDocument: TextDocument;
    position: Position;
    variables?: Values;
}

export interface GetHoverParams {
    textDocument: TextDocument;
    position: Position;
    variables?: Values;
}

export interface HoverV2 extends Hover {
    contents: MarkupContent; // Type narrowing since we know we are not going to return deprecated content
}

export interface GetDiagnosticsParams {
    textDocument: TextDocument;
    /**
     * Optional map of known variables. When provided, identifier nodes whose
     * name is not a built-in and not found in this map surface as an
     * `unknown-ident` warning. Omitting this map disables the check entirely.
     */
    variables?: Values;
}

/**
 * Describes the arity (expected number of arguments) for a function.
 */
export interface ArityInfo {
    /** Minimum number of required arguments */
    min: number;
    /** Maximum number of arguments, or undefined if variadic (unlimited) */
    max: number | undefined;
}
