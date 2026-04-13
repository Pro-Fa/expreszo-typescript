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
  Range
} from 'vscode-languageserver-types';
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
     * context. Currently handles `arity-too-few` (inserts placeholder args)
     * and `unknown-ident` (Levenshtein "did you mean" suggestions).
     */
    getCodeActions(params: GetCodeActionsParams): CodeAction[];
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
    type: 'number' | 'string' | 'name' | 'keyword' | 'operator' | 'function' | 'punctuation' | 'constant';
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
