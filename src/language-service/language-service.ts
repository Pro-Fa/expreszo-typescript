// Lightweight language service (worker-LSP style) for ExpresZo
// Provides: completions, hover, and syntax highlighting using the existing tokenizer

import {
  TOP,
  TNUMBER,
  TCONST,
  TSTRING,
  TPAREN,
  TBRACKET,
  TCOMMA,
  TNAME,
  TSEMICOLON,
  TKEYWORD,
  TBRACE,
  Token
} from '../parsing';
import { Parser } from '../parsing/parser';
import type {
  HighlightToken,
  LanguageServiceOptions,
  GetCompletionsParams,
  GetHoverParams,
  GetDiagnosticsParams,
  GetCodeActionsParams,
  FormatParams,
  PrepareRenameParams,
  RenameParams,
  GetInlayHintsParams,
  LanguageServiceApi,
  HoverV2
} from './language-service.types';
import type {
  CompletionItem,
  Range,
  Diagnostic,
  DocumentSymbol,
  FoldingRange,
  Location,
  Position,
  SignatureHelp,
  SemanticTokens,
  CodeAction,
  TextEdit,
  WorkspaceEdit,
  InlayHint
} from 'vscode-languageserver-types';
import { CompletionItemKind, MarkupKind, InsertTextFormat } from 'vscode-languageserver-types';
import { TextDocument } from 'vscode-languageserver-textdocument';
import { BUILTIN_KEYWORD_DOCS, DEFAULT_CONSTANT_DOCS } from './language-service.documentation';
import { FunctionDetails } from './language-service.models';
import {
  valueTypeName,
  extractPathPrefix,
  makeTokenStream,
  iterateTokens,
  TokenSpan,
  findCommentSpans
} from './ls-utils';
import { pathVariableCompletions, tryVariableHoverUsingSpans } from './variable-utils';
import {
  getDiagnosticsForDocument,
  createDiagnosticFromParseError,
  createDiagnosticFromError
} from './diagnostics';
import { ParseError } from '../types/errors';
import { createParseCache } from './shared/parse-cache';
import { getDocumentSymbols as computeDocumentSymbols } from './document-symbols';
import { getFoldingRanges as computeFoldingRanges } from './folding';
import {
  getDefinition as computeDefinition,
  getReferences as computeReferences,
  buildRenameEdit as computeRenameEdit
} from './references';
import { getInlayHints as computeInlayHints } from './inlay-hints';
import { getSignatureHelp as computeSignatureHelp } from './signature-help';
import { encodeSemanticTokens } from './semantic-tokens';
import { getUnknownIdentDiagnostics } from './unknown-ident';
import { getTypeMismatchDiagnostics } from './type-check';
import { getLegacyArgOrderDiagnostics } from './legacy-arg-order';
import { getCodeActions as computeCodeActions } from './code-actions';
import { format as computeFormat } from './formatter';

export function createLanguageService(options: LanguageServiceOptions | undefined = undefined): LanguageServiceApi {
  // Build a parser instance to access keywords/operators/functions/consts
  const parser = new Parser({
    operators: options?.operators
  });

  const parseCache = createParseCache(parser);

  // Token span cache — keyed by URI, evicted when version or text changes.
  // Shared by getHighlighting, getDiagnostics, getHover, and getSignatureHelp
  // so the lexer runs at most once per document version per language-service call.
  interface TokenCacheEntry { version: number; text: string; spans: TokenSpan[] }
  const tokenSpanCache = new Map<string, TokenCacheEntry>();

  function getTokenSpans(textDocument: TextDocument): TokenSpan[] | null {
    const text = textDocument.getText();
    const cached = tokenSpanCache.get(textDocument.uri);
    if (cached && cached.version === textDocument.version && cached.text === text) {
      return cached.spans;
    }
    try {
      const ts = makeTokenStream(parser, text);
      const spans = iterateTokens(ts);
      tokenSpanCache.set(textDocument.uri, { version: textDocument.version, text, spans });
      return spans;
    } catch {
      return null;
    }
  }

  const constantDocs = {
    ...DEFAULT_CONSTANT_DOCS
  } as Record<string, string>;

  // Instance-level cache for function details and names
  // Each language service instance maintains its own cache, making this thread-safe
  // as concurrent uses will operate on separate instances
  let cachedFunctions: FunctionDetails[] | null = null;
  let cachedFunctionNames: Set<string> | null = null;
  let cachedFunctionDetailsMap: Map<string, FunctionDetails> | null = null;
  let cachedConstants: string[] | null = null;

  /**
   * Returns all available functions with their details
   * Results are cached for performance within this instance
   */
  function allFunctions(): FunctionDetails[] {
    if (cachedFunctions !== null) {
      return cachedFunctions;
    }

    // Parser exposes built-in functions on parser.functions
    const definedFunctions = parser.functions ? Object.keys(parser.functions) : [];
    // Unary operators can also be used like functions with parens: sin(x), abs(x), ...
    const unary = parser.unaryOps ? Object.keys(parser.unaryOps) : [];
    // Merge, prefer functions map descriptions where available
    const rawFunctions = Array.from(new Set([...definedFunctions, ...unary]));

    cachedFunctions = rawFunctions.map(name => new FunctionDetails(parser, name));
    cachedFunctionNames = new Set(rawFunctions);
    return cachedFunctions;
  }

  /**
   * Returns a set of function names for fast lookup
   * This ensures the cache is populated before returning
   */
  function functionNamesSet(): Set<string> {
    if (cachedFunctionNames !== null) {
      return cachedFunctionNames;
    }
    allFunctions();
    return cachedFunctionNames ?? new Set<string>();
  }

  function functionDetailsMap(): Map<string, FunctionDetails> {
    if (cachedFunctionDetailsMap !== null) {
      return cachedFunctionDetailsMap;
    }
    const map = new Map<string, FunctionDetails>();
    for (const func of allFunctions()) map.set(func.name, func);
    cachedFunctionDetailsMap = map;
    return map;
  }

  /**
   * Returns all available constants
   * Results are cached for performance within this instance
   */
  function allConstants(): string[] {
    if (cachedConstants !== null) {
      return cachedConstants;
    }
    cachedConstants = parser.numericConstants ? Object.keys(parser.numericConstants) : [];
    cachedConstants = [...cachedConstants, ...Object.keys(parser.buildInLiterals)];

    return cachedConstants;
  }

  function tokenKindToHighlight(t: Token): HighlightToken['type'] {
    switch (t.type) {
      case TNUMBER:
        return 'number';
      case TSTRING:
        return 'string';
      case TCONST:
        return 'constant';
      case TKEYWORD:
        return 'keyword';
      case TOP:
        return 'operator';
      case TPAREN:
      case TBRACE:
      case TBRACKET:
      case TCOMMA:
      case TSEMICOLON:
        return 'punctuation';
      case TNAME:
      default: {
        // Use cached set for fast function name lookup
        if (t.type === TNAME && functionNamesSet().has(String(t.value))) {
          return 'function';
        }

        return 'name';
      }
    }
  }

  function functionCompletions(rangeFull: Range): CompletionItem[] {
    return allFunctions().map(func => ({
      label: func.name,
      kind: CompletionItemKind.Function,
      detail: func.details(),
      documentation: func.docs(),
      insertTextFormat: InsertTextFormat.Snippet,
      textEdit: { range: rangeFull, newText: func.completionText() }
    }));
  }

  function constantCompletions(rangeFull: Range): CompletionItem[] {
    return allConstants().map(name => ({
      label: name,
      kind: CompletionItemKind.Constant,
      detail: valueTypeName(parser.numericConstants[name] ?? parser.buildInLiterals[name]),
      documentation: constantDocs[name],
      textEdit: { range: rangeFull, newText: name }
    }));
  }

  function keywordCompletions(rangeFull: Range): CompletionItem[] {
    return (parser.keywords || []).map(keyword => ({
      label: keyword,
      kind: CompletionItemKind.Keyword,
      detail: 'keyword',
      documentation: BUILTIN_KEYWORD_DOCS[keyword],
      textEdit: { range: rangeFull, newText: keyword }
    }));
  }

  function filterByPrefix(items: CompletionItem[], prefix: string): CompletionItem[] {
    if (!prefix) {
      return items;
    }
    const lower = prefix.toLowerCase();
    return items.filter(i => i.label.toLowerCase().startsWith(lower));
  }

  function getCompletions(params: GetCompletionsParams): CompletionItem[] {
    const { textDocument, variables, position } = params;
    const text = textDocument.getText();
    const offsetPosition = textDocument.offsetAt(position);

    const { start, prefix } = extractPathPrefix(text, offsetPosition);

    // Build ranges for replacement
    const rangeFull: Range = { start: textDocument.positionAt(start), end: position };
    const lastDot = prefix.lastIndexOf('.');
    const partial = lastDot >= 0 ? prefix.slice(lastDot + 1) : prefix;
    const replaceStartOffset =
            start + (prefix.length - partial.length);
    const rangePartial: Range = {
      start: textDocument.positionAt(replaceStartOffset),
      end: position
    };

    // Inside a dotted path, only offer variable path completions.
    // Built-in functions, constants, and keywords don't live on object paths.
    if (prefix.includes('.')) {
      return pathVariableCompletions(variables, prefix, rangePartial);
    }

    const all: CompletionItem[] = [
      ...functionCompletions(rangeFull),
      ...constantCompletions(rangeFull),
      ...keywordCompletions(rangeFull),
      ...pathVariableCompletions(variables, prefix, rangePartial)
    ];

    return filterByPrefix(all, prefix);
  }

  function getHover(params: GetHoverParams): HoverV2 {
    const { textDocument, position, variables } = params;

    // Reuse the cached token spans — avoids re-tokenising on each hover request.
    const spans = getTokenSpans(textDocument) ?? [];

    const variableHover = tryVariableHoverUsingSpans(textDocument, position, variables, spans);
    if (variableHover) {
      return variableHover;
    }

    // Fallback to token-based hover
    const offset = textDocument.offsetAt(position);
    const span = spans.find(s => offset >= s.start && offset <= s.end);
    if (!span) {
      return { contents: { kind: MarkupKind.PlainText, value: '' } };
    }

    const token = span.token;
    const label = String(token.value);

    // TCONST is included here so that built-in literals (true/false/null) get
    // their documentation shown just like numeric constants (PI, E).
    if (token.type === TNAME || token.type === TKEYWORD || token.type === TCONST) {
      // Function hover — only TNAME tokens can be function names
      if (token.type === TNAME) {
        const func = allFunctions().find(f => f.name === label);
        if (func) {
          const range: Range = {
            start: textDocument.positionAt(span.start),
            end: textDocument.positionAt(span.end)
          };
          const value = func.docs() ?? func.details();
          return {
            contents: { kind: MarkupKind.Markdown, value },
            range
          };
        }
      }

      // Constant hover (numeric constants and built-in literals)
      if (allConstants().includes(label)) {
        const v = parser.numericConstants[label] ?? parser.buildInLiterals[label];
        const doc = constantDocs[label];
        const range: Range = {
          start: textDocument.positionAt(span.start),
          end: textDocument.positionAt(span.end)
        };
        return {
          contents: {
            kind: MarkupKind.PlainText,
            value: `${label}: ${valueTypeName(v)}${doc ? `\n\n${doc}` : ''}`
          },
          range
        };
      }

      // Keyword hover
      if (token.type === TKEYWORD) {
        const doc = BUILTIN_KEYWORD_DOCS[label];
        const range: Range = {
          start: textDocument.positionAt(span.start),
          end: textDocument.positionAt(span.end)
        };
        return { contents: { kind: MarkupKind.PlainText, value: doc || 'keyword' }, range };
      }
    }

    // Operators: show a simple label
    if (token.type === TOP) {
      const range: Range = { start: textDocument.positionAt(span.start), end: textDocument.positionAt(span.end) };
      return { contents: { kind: MarkupKind.PlainText, value: `operator: ${label}` }, range };
    }

    // Numbers and strings
    if (token.type === TNUMBER || token.type === TSTRING) {
      const range: Range = { start: textDocument.positionAt(span.start), end: textDocument.positionAt(span.end) };
      return { contents: { kind: MarkupKind.PlainText, value: `${valueTypeName(token.value)}` }, range };
    }

    return { contents: { kind: MarkupKind.PlainText, value: '' } };
  }

  function getHighlighting(textDocument: TextDocument): HighlightToken[] {
    const text = textDocument.getText();
    const spans = getTokenSpans(textDocument) ?? [];
    const tokens: HighlightToken[] = spans.map(span => ({
      type: tokenKindToHighlight(span.token),
      start: span.start,
      end: span.end,
      value: span.token.value
    }));
    // The parser strips comments before tokenization, so rescan the raw text
    // and append comment highlights directly. Sorting keeps clients that
    // expect ordered spans happy.
    for (const c of findCommentSpans(text)) {
      tokens.push({ type: 'comment', start: c.start, end: c.end });
    }
    tokens.sort((a, b) => a.start - b.start);
    return tokens;
  }

  /**
   * Analyzes the document for function calls and checks if they have the correct number of arguments.
   * Returns diagnostics for function calls with incorrect argument counts, as well as
   * syntax errors detected by the parser (unclosed strings, brackets, unknown characters, etc.).
   */
  function getDiagnostics(params: GetDiagnosticsParams): Diagnostic[] {
    const { textDocument } = params;
    const diagnostics: Diagnostic[] = [];

    // Use the parse cache so we don't reparse for every diagnostic sub-pass.
    const { parseError } = parseCache.get(textDocument);
    if (parseError) {
      if (parseError instanceof ParseError) {
        diagnostics.push(createDiagnosticFromParseError(textDocument, parseError));
      } else {
        diagnostics.push(createDiagnosticFromError(textDocument, parseError));
      }
    }

    // Use the token span cache for arity checking.
    // Returns null when tokenisation itself fails (e.g. unclosed string literal),
    // in which case we skip arity/unknown-ident passes and return parse errors only.
    const spans = getTokenSpans(textDocument);
    if (!spans) return diagnostics;

    // Function argument count diagnostics
    const functionDiagnostics = getDiagnosticsForDocument(params, spans, functionNamesSet(), functionDetailsMap());
    diagnostics.push(...functionDiagnostics);

    // Unknown identifier diagnostics (opt-in via `variables`)
    diagnostics.push(
      ...getUnknownIdentDiagnostics(textDocument, parser, parseCache, params.variables)
    );

    // Type-mismatch diagnostics — literals-only, always on
    diagnostics.push(...getTypeMismatchDiagnostics(textDocument, parseCache));

    // Legacy argument-order diagnostics — suggests reordering to the
    // preferred (collection-first) form for dual-order built-ins
    diagnostics.push(...getLegacyArgOrderDiagnostics(textDocument, parseCache));

    return diagnostics;
  }

  function getDocumentSymbols(params: { textDocument: TextDocument }): DocumentSymbol[] {
    return computeDocumentSymbols(params.textDocument, parseCache);
  }

  function getFoldingRanges(params: { textDocument: TextDocument }): FoldingRange[] {
    return computeFoldingRanges(params.textDocument, parseCache);
  }

  function getDefinition(params: { textDocument: TextDocument; position: Position }): Location | null {
    return computeDefinition(params.textDocument, parseCache, params.position);
  }

  function getReferences(params: { textDocument: TextDocument; position: Position }): Location[] {
    return computeReferences(params.textDocument, parseCache, params.position);
  }

  function getSignatureHelp(params: { textDocument: TextDocument; position: Position }): SignatureHelp | null {
    const spans = getTokenSpans(params.textDocument) ?? [];
    return computeSignatureHelp(params.textDocument, parser, spans, params.position, functionNamesSet());
  }

  function getSemanticTokens(params: { textDocument: TextDocument }): SemanticTokens {
    const highlight = getHighlighting(params.textDocument);
    return encodeSemanticTokens(params.textDocument, highlight);
  }

  function getCodeActions(params: GetCodeActionsParams): CodeAction[] {
    return computeCodeActions(params, parser, functionNamesSet());
  }

  function format(params: FormatParams): TextEdit[] {
    return computeFormat(params, parseCache);
  }

  /**
   * Returns the range of the symbol at `position` if it is renameable (i.e. a
   * user-defined identifier, not a built-in function name or constant).
   * Returns null when the cursor is not on a renameable name.
   */
  function prepareRename(params: PrepareRenameParams): Range | null {
    const { textDocument, position } = params;
    const spans = getTokenSpans(textDocument) ?? [];
    const offset = textDocument.offsetAt(position);
    const hit = spans.find(s => offset >= s.start && offset <= s.end);
    if (!hit || hit.token.type !== TNAME) return null;
    const name = String(hit.token.value);
    // Built-in functions and constants refer to external bindings — renaming
    // them inside the expression alone would break evaluation semantics.
    if (functionNamesSet().has(name) || allConstants().includes(name)) return null;
    return {
      start: textDocument.positionAt(hit.start),
      end: textDocument.positionAt(hit.end)
    };
  }

  /**
   * Replaces all occurrences of the identifier at `position` with `newName`,
   * covering both body references (Ident / NameRef nodes) and lambda / function-def
   * parameter declaration sites. Returns null when the cursor is not on a
   * renameable identifier.
   */
  function rename(params: RenameParams): WorkspaceEdit | null {
    const { textDocument, position, newName } = params;
    const spans = getTokenSpans(textDocument) ?? [];
    const offset = textDocument.offsetAt(position);
    const hit = spans.find(s => offset >= s.start && offset <= s.end);
    if (!hit || hit.token.type !== TNAME) return null;
    const targetName = String(hit.token.value);
    if (functionNamesSet().has(targetName) || allConstants().includes(targetName)) return null;
    return computeRenameEdit(textDocument, parseCache, targetName, newName);
  }

  function getInlayHints(params: GetInlayHintsParams): InlayHint[] {
    return computeInlayHints(params.textDocument, parseCache, params.range);
  }

  return {
    getCompletions,
    getHover,
    getHighlighting,
    getDiagnostics,
    getDocumentSymbols,
    getFoldingRanges,
    getDefinition,
    getReferences,
    getSignatureHelp,
    getSemanticTokens,
    getCodeActions,
    format,
    prepareRename,
    rename,
    getInlayHints
  };

}
