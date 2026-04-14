# Language Service

> **Audience:** Developers building IDE integrations or code editors with ExpresZo support.

The library includes a full-featured language service that produces LSP-compatible responses for ExpresZo expressions. It is designed to be wired into editors like Monaco (used by VS Code), CodeMirror, or directly into a Language Server Protocol host.

## Features

- **Code completions** — autocomplete for functions, operators, keywords, constants, and user-defined variables
  - *Snippet support* — function completions include tab stops with parameter placeholders (e.g. `sum(${1:a})`)
  - *Path-based variable completions* — typing `user.` shows `user.name`, `user.profile.email`, and also recognises bracketed paths like `items[0].`
  - *Text-edit ranges* — each completion carries the exact source range it should replace, so dotted-path suggestions replace only the last segment
- **Hover information** — documentation tooltips for functions, constants, built-in literals (`true` / `false` / `null`), keywords, and variables
  - *Variable value previews* — hovering a variable resolves its runtime value and renders a truncated JSON preview
  - *Nested-path support* — hovering `user.profile.name` walks the variable map and shows the value at that exact path
- **Syntax highlighting** — classified tokens for numbers, strings, names, keywords, operators, functions, constants, punctuation, and comments
- **Semantic tokens** — LSP-protocol semantic tokens with a stable legend exported as `SEMANTIC_TOKENS_LEGEND`
- **Diagnostics** — four independent diagnostic passes:
  - *Parse errors* — unclosed strings, unbalanced brackets, illegal escapes, unexpected tokens
  - *Arity checks* — `arity-too-few` / `arity-too-many` for every built-in function call
  - *Unknown identifiers* — opt-in warnings for names that are not built-ins and not in the caller-supplied `variables` map (scope-aware: lambda and function-def parameters are treated as in-scope inside their body)
  - *Type mismatches* — literal-only type checking for built-in function arguments (e.g. `pow([1,2], 2)` warns that argument 1 should be a number)
- **Code actions (quick fixes)** — `did-you-mean` Levenshtein suggestions for unknown identifiers and "add missing argument" fills for arity-too-few diagnostics
- **Document symbols** — outline of every variable, member chain, and function call in the expression
- **Folding ranges** — multi-line `case`, array literal, and object literal blocks can be collapsed
- **Go to definition** — jumps to the first occurrence of a free variable, or to the parameter declaration site in the enclosing lambda / function-def
- **Find all references** — every occurrence of an identifier within the expression
- **Signature help** — parameter hints for the enclosing function call with active-parameter tracking through nested brackets and braces
- **Rename symbol** — replaces every body reference *and* every lambda / function-def parameter declaration in a single `WorkspaceEdit`; built-in function names and constants are rejected
- **Inlay hints** — greyed parameter-name labels rendered before each argument of multi-parameter built-in functions (e.g. `pow(` shows `base:` and `exp:`)
- **Document formatter** — pretty-prints the whole expression using an AST-based visitor that respects operator precedence and breaks nested calls onto multiple lines

## Basic Usage

```js
import { createLanguageService } from '@pro-fa/expreszo';
import { TextDocument } from 'vscode-languageserver-textdocument';

const ls = createLanguageService();

const doc = TextDocument.create(
  'inmemory://expr',
  'expreszo',
  1,
  'pow(user.score, 2) + sum(items)'
);

const variables = {
  user: { score: 95 },
  items: [1, 2, 3]
};

// Completions at position 4 (right after "pow(")
const completions = ls.getCompletions({
  textDocument: doc,
  position: { line: 0, character: 4 },
  variables
});

// Hover information
const hover = ls.getHover({
  textDocument: doc,
  position: { line: 0, character: 8 },
  variables
});

// Diagnostics — parse errors, arity, type mismatches, optional unknown-ident
const diagnostics = ls.getDiagnostics({ textDocument: doc, variables });

// Signature help inside a function call
const sigHelp = ls.getSignatureHelp({
  textDocument: doc,
  position: { line: 0, character: 6 }
});

// Format the document
const edits = ls.format({ textDocument: doc });
```

All methods are synchronous. The service maintains an internal parse cache and a token-span cache keyed by `(uri, version, text)`, so repeated calls against the same document version share work automatically.

## Monaco Editor Integration Sample

A complete working example of Monaco Editor integration ships in the repository. To run it:

```bash
# Build the UMD bundle and start the sample server
npm run playground
```

Then open http://localhost:8080 in your browser. The sample demonstrates every feature in the list above, wired into the corresponding Monaco provider. Notable Monaco provider registrations:

| Language service method | Monaco provider |
|---|---|
| `getCompletions` | `registerCompletionItemProvider` |
| `getHover` | `registerHoverProvider` |
| `getHighlighting` | manual `deltaDecorations` (token-based colouring) |
| `getSemanticTokens` | `registerDocumentSemanticTokensProvider` |
| `getDiagnostics` | `monaco.editor.setModelMarkers` |
| `getCodeActions` | `registerCodeActionProvider` |
| `getDocumentSymbols` | `registerDocumentSymbolProvider` |
| `getFoldingRanges` | `registerFoldingRangeProvider` |
| `getDefinition` | `registerDefinitionProvider` |
| `getReferences` | `registerReferenceProvider` |
| `getSignatureHelp` | `registerSignatureHelpProvider` |
| `prepareRename` / `rename` | `registerRenameProvider` |
| `getInlayHints` | `registerInlayHintsProvider` |
| `format` | `registerDocumentFormattingEditProvider` |

The sample code is located in `samples/language-service-sample/`. It also demonstrates how to wrap a Monaco `ITextModel` as an LSP-compatible `TextDocument`, which is the only glue you need beyond the provider callbacks.

## Advanced Features

### Nested variable completions

The service builds an internal trie over the `variables` map and exposes dotted-path completions. When you type a dot after a variable name, you get completions for its properties:

```js
const variables = {
  user: {
    name: 'Ada',
    profile: { email: 'ada@example.com', age: 30 }
  },
  config: { timeout: 5000, retries: 3 }
};

// Typing "user." returns: user.name, user.profile
// Typing "user.profile." returns: user.profile.email, user.profile.age
// Typing "items[0]." also walks into array elements using the first element's shape
```

When completing an array variable (e.g. `items`), an extra snippet completion is offered with the shape `items[${1}]` so clients can tab directly into the index.

**Monaco integration:** add `triggerCharacters: ['.']` to your completion provider so completions fire automatically on dot.

### Snippet completions with parameter placeholders

Function completions ship with `insertTextFormat: 2` (Snippet) and an `insertText` (or `textEdit.newText`) containing numbered tab stops:

```js
// The completion for `pow` has newText: "pow(${1:base}, ${2:exp})"
// After accepting the completion the editor places the caret in the "base"
// placeholder, tab moves to "exp", tab again exits the call.
```

**Monaco integration:**

```js
const suggestions = items.map(it => ({
  label: it.label,
  kind: mapKind(it.kind),
  insertText: it.textEdit?.newText || it.insertText || it.label,
  insertTextRules: it.insertTextFormat === 2
    ? monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet
    : undefined,
  range
}));
```

### Text-edit ranges for precise replacement

Completion items carry a `textEdit.range` describing the exact range the client should replace. This matters for dotted paths: when completing `user.na|`, only `na` should be replaced, not `user.na`.

```js
const range = it.textEdit?.range
  ? new monaco.Range(
      it.textEdit.range.start.line + 1,
      it.textEdit.range.start.character + 1,
      it.textEdit.range.end.line + 1,
      it.textEdit.range.end.character + 1
    )
  : defaultWordRange;
```

### Variable value previews in hover

Hovering a variable (or any prefix of a dotted path) renders a Markdown block with the type and a truncated JSON preview:

```
user: Variable (object)

Value Preview
{
  "name": "Ada",
  "score": 95
}
```

The preview is limited to roughly three lines and fifty characters per line so large structures don't flood the hover popup. Hovering built-in literals (`true`, `false`, `null`) also shows their documentation.

### Parse cache and token cache

`createLanguageService` builds two internal caches keyed by `(uri, version, text)`:

- A **parse cache** holding the AST and any `ParseError` — shared by `getDocumentSymbols`, `getFoldingRanges`, `getDefinition`, `getReferences`, `getDiagnostics`, `getInlayHints`, `format`, and `rename`.
- A **token-span cache** holding the lexer output — shared by `getHighlighting`, `getSemanticTokens`, `getHover`, `getSignatureHelp`, `prepareRename`, `rename`, and the arity pass inside `getDiagnostics`.

Both caches evict automatically when the document's `version` changes, so clients don't need to manage them.

### Semantic tokens legend

`SEMANTIC_TOKENS_LEGEND` is exported as a stable ordered list of token types. Register it verbatim with your editor:

```js
import { SEMANTIC_TOKENS_LEGEND } from '@pro-fa/expreszo';

monaco.languages.registerDocumentSemanticTokensProvider(languageId, {
  getLegend() {
    return {
      tokenTypes: [...SEMANTIC_TOKENS_LEGEND.tokenTypes],
      tokenModifiers: [...SEMANTIC_TOKENS_LEGEND.tokenModifiers]
    };
  },
  provideDocumentSemanticTokens(model) {
    const result = ls.getSemanticTokens({ textDocument: makeTextDocument(model) });
    return { data: new Uint32Array(result.data), resultId: result.resultId };
  },
  releaseDocumentSemanticTokens() {}
});
```

Punctuation tokens (parens, commas, braces) are intentionally omitted from the legend — the LSP protocol has no standard `punctuation` token type, so the service returns only meaningful types.

### Scope-aware go to definition

For free variables `getDefinition` returns the first occurrence of the name in the AST. For lambda and function-def parameters it returns the **parameter declaration site** in the head of the enclosing lambda. In `(x) => x + x`, clicking either body `x` jumps to the parameter position, not to the other body reference.

### Code actions / quick fixes

Two built-in quick fixes:

- **`arity-too-few`** — inserts the missing argument placeholders. The placeholder values are type-aware when the function has documented parameter types (`""` for `string`, `[]` for `array`, `{}` for `object`, `false` for `boolean`, `0` otherwise).
- **`unknown-ident`** — runs a Levenshtein search (edit distance ≤ 2) over every known name (built-ins + user variables + lambda params) and offers a `Did you mean '<closest>'?` suggestion when a match exists.

Pass the diagnostics for the current range in the `context.diagnostics` field; the service only emits actions for codes it recognises.

### Rename with lambda support

`rename` handles both body references and parameter declaration sites. Renaming `x` in `(x) => x + x` updates all three positions — the declaration in the head plus both body uses — in a single `WorkspaceEdit`. Built-in function names, numeric constants, and keywords are rejected by `prepareRename`, which returns `null` so the editor can display "cannot rename this symbol".

### Inlay hints

`getInlayHints` walks every `Call` node in the AST, looks the callee up in the built-in function registry, and emits an `InlayHint` with the parameter name (e.g. `base:`) before each argument. Single-parameter functions (`sin`, `abs`, …) are skipped to reduce noise. An optional `range` on the request narrows the result to the client's current viewport.

### Document formatter

`format` is an AST-based pretty-printer:

- Multi-line `case`, array literals, and object literals stay multi-line when the source span already crosses multiple lines, and collapse to one line otherwise.
- `Call` nodes break onto multiple lines when any argument is itself a `Call`, `Lambda`, or `FunctionDef`, producing a readable indented tree.
- Precedence is tracked so the printer only emits parentheses that are actually needed.

The returned array contains a single whole-document `TextEdit` if the formatted output differs from the current source, or is empty when the document is already formatted or fails to parse.

## API Reference

### createLanguageService(options?)

Creates a new language service instance.

**Parameters:**
- `options` (optional): `LanguageServiceOptions`
  - `operators`: `Record<string, boolean>` — map of operator names to booleans indicating whether they are allowed

**Returns:** `LanguageServiceApi`

```js
const ls = createLanguageService({
  operators: { '+': true, '-': true, '*': true, '/': true }
});
```

### ls.getCompletions(params)

**Parameters:** `GetCompletionsParams`
- `textDocument`: `TextDocument`
- `position`: `Position`
- `variables`: `Values` (optional)

**Returns:** `CompletionItem[]`

Each `CompletionItem` has `label`, `kind`, `detail`, optional `documentation`, optional `insertText`, optional `insertTextFormat` (1 = PlainText, 2 = Snippet), and optional `textEdit` with the precise replacement range.

### ls.getHover(params)

**Parameters:** `GetHoverParams` (`textDocument`, `position`, `variables?`)

**Returns:** `HoverV2` — identical to LSP `Hover` but with `contents` narrowed to `MarkupContent` (never a deprecated string or array).

### ls.getHighlighting(textDocument)

**Returns:** `HighlightToken[]`

```ts
interface HighlightToken {
  type:
    | 'number' | 'string' | 'name' | 'keyword'
    | 'operator' | 'function' | 'punctuation'
    | 'constant' | 'comment';
  start: number;  // 0-based character offset
  end: number;    // exclusive
  value?: string | number | boolean | undefined;
}
```

Comments are rescanned from the raw text since the parser strips them before tokenisation.

### ls.getSemanticTokens(params)

**Parameters:** `{ textDocument: TextDocument }`

**Returns:** `SemanticTokens` — the LSP-compatible `{ data: number[] }` delta-encoded stream using the legend exported as `SEMANTIC_TOKENS_LEGEND`.

### ls.getDiagnostics(params)

**Parameters:** `GetDiagnosticsParams`
- `textDocument`: `TextDocument`
- `variables`: `Values` (optional) — when provided, enables the `unknown-ident` warning pass

**Returns:** `Diagnostic[]`

Every diagnostic carries a `code` identifying the pass that emitted it:

| `code` | Severity | Description |
|---|---|---|
| *(none)* | Error | Parse error (unclosed string, unbalanced brackets, …). The range is a 10-character window starting at the parser's reported position. |
| `arity-too-few` | Error | Function called with fewer arguments than required. |
| `arity-too-many` | Error | Function called with more arguments than allowed (non-variadic functions only). |
| `unknown-ident` | Warning | Identifier not in built-ins or `variables`. Scope-aware: lambda and function-def parameters are in scope inside their body. Opt-in: requires `variables` on the request. |
| `type-mismatch` | Warning | Literal argument whose type does not match the function's documented parameter type. Only fires on concrete literals (strings, numbers, booleans, arrays, objects, lambdas), not on computed expressions. |

```js
const diagnostics = ls.getDiagnostics({ textDocument: doc, variables });
// [
//   { code: 'arity-too-few', message: "Function 'pow' expects at least 2 arguments, but got 1.", ... },
//   { code: 'unknown-ident', message: "Unknown identifier 'lenght'.", ... },
//   { code: 'type-mismatch', message: "Argument 1 of 'pow' expects number, got array.", ... }
// ]
```

### ls.getCodeActions(params)

**Parameters:** `GetCodeActionsParams`
- `textDocument`: `TextDocument`
- `range`: `Range` — the range the user selected or positioned the cursor in
- `context.diagnostics`: `readonly Diagnostic[]` — the diagnostics overlapping `range` (usually all of them, filtered by the client)
- `context.variables`: `Values` (optional) — used by the `unknown-ident` fix to seed the `did-you-mean` candidate list

**Returns:** `CodeAction[]` — each action carries a `title`, `kind: 'quickfix'`, the original `diagnostics`, and an `edit: WorkspaceEdit` that applies the fix.

Two quick-fix families are implemented: `arity-too-few` (inserts placeholder arguments) and `unknown-ident` (Levenshtein suggestions).

### ls.getDocumentSymbols(params)

**Parameters:** `{ textDocument: TextDocument }`

**Returns:** `DocumentSymbol[]` — one entry per unique `(fullPath, kind)` pair. Member chains use their dotted path as the name, and every identifier used as a function callee is tagged with `SymbolKind.Function`.

### ls.getFoldingRanges(params)

**Parameters:** `{ textDocument: TextDocument }`

**Returns:** `FoldingRange[]` — one per multi-line `Case`, `ArrayLit`, or `ObjectLit` node.

### ls.getDefinition(params)

**Parameters:** `{ textDocument: TextDocument; position: Position }`

**Returns:** `Location | null`

For free variables returns the first occurrence in the AST. For lambda / function-def parameters returns the declaration position in the enclosing head.

### ls.getReferences(params)

**Parameters:** `{ textDocument: TextDocument; position: Position }`

**Returns:** `Location[]` — every occurrence of the identifier at the cursor, including the definition itself.

### ls.getSignatureHelp(params)

**Parameters:** `{ textDocument: TextDocument; position: Position }`

**Returns:** `SignatureHelp | null`

Walks the cached token stream leftwards from the cursor, tracking paren / bracket / brace depth, to find the innermost enclosing function call. Counts top-level commas within the call to derive the active parameter index, clamped to the function's declared parameter count so variadic functions show the last named parameter highlighted for trailing arguments.

### ls.prepareRename(params)

**Parameters:** `PrepareRenameParams` (`textDocument`, `position`)

**Returns:** `Range | null`

Returns the range of the symbol at `position` if it is renameable. Returns `null` when the cursor is on a built-in function name, numeric constant, built-in literal, keyword, or any token that is not an identifier — clients use this to gate the rename action and to pre-fill the rename input with the current text.

### ls.rename(params)

**Parameters:** `RenameParams` (`textDocument`, `position`, `newName`)

**Returns:** `WorkspaceEdit | null`

Replaces every `Ident` / `NameRef` body reference **and** every lambda / function-def parameter declaration site for the identifier at `position`. Returns `null` when the cursor is on a non-renameable name or when the document fails to parse.

### ls.getInlayHints(params)

**Parameters:** `GetInlayHintsParams`
- `textDocument`: `TextDocument`
- `range`: `Range` (optional) — viewport range; hints outside it are omitted

**Returns:** `InlayHint[]`

Emits a `kind: InlayHintKind.Parameter` hint at the start of each argument of every built-in function call with two or more documented parameters. Each hint's label is the parameter name followed by a colon (e.g. `base:`). Single-parameter functions are skipped.

### ls.format(params)

**Parameters:** `FormatParams`
- `textDocument`: `TextDocument`
- `options`: `FormatOptions` (optional)
  - `indentSize`: `number` — default `2`

**Returns:** `TextEdit[]`

Returns a single whole-document `TextEdit` when the formatted output differs from the current source, or an empty array when the document is already formatted or fails to parse.

## Wrapping a Monaco Model as a TextDocument

All language service methods accept an LSP `TextDocument`. For Monaco, the following wrapper is sufficient:

```js
function makeTextDocument(model) {
  return {
    uri: model.uri.toString(),
    getText: () => model.getValue(),
    positionAt: (offset) => {
      const p = model.getPositionAt(offset);
      return { line: p.lineNumber - 1, character: p.column - 1 };
    },
    offsetAt: (pos) =>
      model.getOffsetAt(new monaco.Position(pos.line + 1, pos.character + 1))
  };
}
```

Note the 1-based ↔ 0-based conversion on positions — Monaco uses 1-based line/column, LSP uses 0-based.

## TypeScript Types

The library exports every public type from the language service module:

```typescript
import type {
  // Core API
  LanguageServiceApi,
  LanguageServiceOptions,

  // Request parameter types
  GetCompletionsParams,
  GetHoverParams,
  GetDiagnosticsParams,
  GetCodeActionsParams,
  FormatParams,
  PrepareRenameParams,
  RenameParams,
  GetInlayHintsParams,

  // Response / supporting types
  HoverV2,
  HighlightToken,
  ArityInfo
} from '@pro-fa/expreszo';

// The stable semantic-tokens legend (value, not type)
import { SEMANTIC_TOKENS_LEGEND } from '@pro-fa/expreszo';
```

### LSP types

The response shapes are direct re-uses of `vscode-languageserver-types`, so you can import them from there for type annotations:

```typescript
import type {
  Position,
  Range,
  Location,
  CompletionItem,
  CompletionItemKind,
  MarkupContent,
  MarkupKind,
  InsertTextFormat,
  Diagnostic,
  DiagnosticSeverity,
  DocumentSymbol,
  FoldingRange,
  SignatureHelp,
  SemanticTokens,
  CodeAction,
  TextEdit,
  WorkspaceEdit,
  InlayHint,
  InlayHintKind
} from 'vscode-languageserver-types';

import type { TextDocument } from 'vscode-languageserver-textdocument';
```

This guarantees compatibility with any LSP-based editor or tool that already speaks these types.
