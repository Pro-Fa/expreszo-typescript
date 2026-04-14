import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { TextDocument } from 'vscode-languageserver-textdocument';
import type { LanguageServiceApi } from '../language-service/language-service.types.js';
import type { Values } from '../types/values.js';
import type { Diagnostic } from 'vscode-languageserver-types';
import { resolvePosition, type PositionInput } from './position.js';

const DEFAULT_URI = 'expreszo://inline';

const positionSchema = z.union([
  z.object({ offset: z.number().int().min(0) }).strict(),
  z.object({
    line: z.number().int().min(0),
    character: z.number().int().min(0)
  }).strict()
]);

const variablesSchema = z.record(z.string(), z.unknown());

const rangeSchema = z.object({
  start: z.object({
    line: z.number().int().min(0),
    character: z.number().int().min(0)
  }).strict(),
  end: z.object({
    line: z.number().int().min(0),
    character: z.number().int().min(0)
  }).strict()
}).strict();

const diagnosticSchema = z.object({
  range: rangeSchema,
  severity: z.number().int().optional(),
  message: z.string(),
  code: z.union([z.string(), z.number()]).optional(),
  source: z.string().optional()
}).passthrough();

const baseShape = {
  expression: z.string().min(1).describe('The expreszo expression source text.'),
  uri: z.string().optional().describe('Optional document URI. Defaults to "expreszo://inline".')
};

const positionFieldShape = {
  position: positionSchema.describe(
    'Cursor position. Either { offset } (0-based index into expression) or { line, character } (LSP style, both 0-based).'
  )
};

const variablesFieldShape = {
  variables: variablesSchema.optional().describe('Optional map of variable names to runtime values, used to include them in completions/hover.')
};

function jsonResult(value: unknown) {
  return {
    content: [
      {
        type: 'text' as const,
        text: JSON.stringify(value, null, 2)
      }
    ]
  };
}

function errorResult(err: unknown) {
  const message = err instanceof Error ? err.message : String(err);
  return {
    isError: true,
    content: [
      {
        type: 'text' as const,
        text: message
      }
    ]
  };
}

function buildDocument(expression: string, uri: string | undefined): TextDocument {
  return TextDocument.create(uri ?? DEFAULT_URI, 'plaintext', 1, expression);
}

export function registerTools(server: McpServer, ls: LanguageServiceApi): void {
  server.registerTool(
    'expreszo_get_completions',
    {
      title: 'Expreszo: get completions',
      description:
        'Returns LSP-style completion items (functions, constants, keywords, provided variables) for an expreszo expression at the given cursor position.',
      inputSchema: {
        ...baseShape,
        ...positionFieldShape,
        ...variablesFieldShape
      }
    },
    async ({ expression, uri, position, variables }) => {
      try {
        const doc = buildDocument(expression, uri);
        const result = ls.getCompletions({
          textDocument: doc,
          position: resolvePosition(doc, position as PositionInput),
          variables: variables as Values | undefined
        });
        return jsonResult(result);
      } catch (err) {
        return errorResult(err);
      }
    }
  );

  server.registerTool(
    'expreszo_get_hover',
    {
      title: 'Expreszo: get hover',
      description:
        'Returns hover information (signature, documentation) for the identifier at the given cursor position in an expreszo expression.',
      inputSchema: {
        ...baseShape,
        ...positionFieldShape,
        ...variablesFieldShape
      }
    },
    async ({ expression, uri, position, variables }) => {
      try {
        const doc = buildDocument(expression, uri);
        const result = ls.getHover({
          textDocument: doc,
          position: resolvePosition(doc, position as PositionInput),
          variables: variables as Values | undefined
        });
        return jsonResult(result);
      } catch (err) {
        return errorResult(err);
      }
    }
  );

  server.registerTool(
    'expreszo_get_highlighting',
    {
      title: 'Expreszo: get syntax highlighting',
      description:
        'Returns an array of syntax highlighting tokens (numbers, strings, names, keywords, operators, functions, punctuation, constants) for an expreszo expression.',
      inputSchema: {
        ...baseShape
      }
    },
    async ({ expression, uri }) => {
      try {
        const doc = buildDocument(expression, uri);
        const result = ls.getHighlighting(doc);
        return jsonResult(result);
      } catch (err) {
        return errorResult(err);
      }
    }
  );

  server.registerTool(
    'expreszo_get_diagnostics',
    {
      title: 'Expreszo: get diagnostics',
      description:
        'Returns diagnostics (parse errors, invalid function arity, unknown identifiers) for an expreszo expression as LSP Diagnostic objects. Passing `variables` enables the unknown-identifier check.',
      inputSchema: {
        ...baseShape,
        ...variablesFieldShape
      }
    },
    async ({ expression, uri, variables }) => {
      try {
        const doc = buildDocument(expression, uri);
        const result = ls.getDiagnostics({
          textDocument: doc,
          variables: variables as Values | undefined
        });
        return jsonResult(result);
      } catch (err) {
        return errorResult(err);
      }
    }
  );

  server.registerTool(
    'expreszo_get_document_symbols',
    {
      title: 'Expreszo: get document symbols',
      description:
        'Returns LSP DocumentSymbol entries for every unique identifier, function call, and member chain used in the expression.',
      inputSchema: {
        ...baseShape
      }
    },
    async ({ expression, uri }) => {
      try {
        const doc = buildDocument(expression, uri);
        const result = ls.getDocumentSymbols({ textDocument: doc });
        return jsonResult(result);
      } catch (err) {
        return errorResult(err);
      }
    }
  );

  server.registerTool(
    'expreszo_get_folding_ranges',
    {
      title: 'Expreszo: get folding ranges',
      description:
        'Returns LSP FoldingRange entries for multi-line case blocks, array literals, and object literals.',
      inputSchema: {
        ...baseShape
      }
    },
    async ({ expression, uri }) => {
      try {
        const doc = buildDocument(expression, uri);
        const result = ls.getFoldingRanges({ textDocument: doc });
        return jsonResult(result);
      } catch (err) {
        return errorResult(err);
      }
    }
  );

  server.registerTool(
    'expreszo_get_definition',
    {
      title: 'Expreszo: get definition',
      description:
        'Returns the LSP Location of the definition of the identifier at the given position (first occurrence within the expression), or null if the position is not on a named symbol.',
      inputSchema: {
        ...baseShape,
        ...positionFieldShape
      }
    },
    async ({ expression, uri, position }) => {
      try {
        const doc = buildDocument(expression, uri);
        const result = ls.getDefinition({
          textDocument: doc,
          position: resolvePosition(doc, position as PositionInput)
        });
        return jsonResult(result);
      } catch (err) {
        return errorResult(err);
      }
    }
  );

  server.registerTool(
    'expreszo_get_references',
    {
      title: 'Expreszo: get references',
      description:
        'Returns every LSP Location where the identifier at the given position is referenced in the expression, including the definition itself.',
      inputSchema: {
        ...baseShape,
        ...positionFieldShape
      }
    },
    async ({ expression, uri, position }) => {
      try {
        const doc = buildDocument(expression, uri);
        const result = ls.getReferences({
          textDocument: doc,
          position: resolvePosition(doc, position as PositionInput)
        });
        return jsonResult(result);
      } catch (err) {
        return errorResult(err);
      }
    }
  );

  server.registerTool(
    'expreszo_get_signature_help',
    {
      title: 'Expreszo: get signature help',
      description:
        'Returns LSP SignatureHelp for the function call enclosing the given cursor position, including the active parameter index. Returns null when the cursor is not inside a recognized call.',
      inputSchema: {
        ...baseShape,
        ...positionFieldShape
      }
    },
    async ({ expression, uri, position }) => {
      try {
        const doc = buildDocument(expression, uri);
        const result = ls.getSignatureHelp({
          textDocument: doc,
          position: resolvePosition(doc, position as PositionInput)
        });
        return jsonResult(result);
      } catch (err) {
        return errorResult(err);
      }
    }
  );

  server.registerTool(
    'expreszo_get_code_actions',
    {
      title: 'Expreszo: get code actions',
      description:
        'Returns LSP CodeAction quick fixes for the diagnostics supplied in `context.diagnostics`. Handles arity-too-few (adds placeholder arguments) and unknown-ident (Levenshtein "did you mean" replacement).',
      inputSchema: {
        ...baseShape,
        range: rangeSchema.describe('Range the editor is requesting actions for.'),
        context: z.object({
          diagnostics: z.array(diagnosticSchema),
          variables: variablesSchema.optional()
        }).describe('LSP CodeActionContext: the diagnostics to act on and optional variables.')
      }
    },
    async ({ expression, uri, range, context }) => {
      try {
        const doc = buildDocument(expression, uri);
        const result = ls.getCodeActions({
          textDocument: doc,
          range,
          context: {
            diagnostics: context.diagnostics as Diagnostic[],
            variables: context.variables as Values | undefined
          }
        });
        return jsonResult(result);
      } catch (err) {
        return errorResult(err);
      }
    }
  );

  server.registerTool(
    'expreszo_get_semantic_tokens',
    {
      title: 'Expreszo: get semantic tokens',
      description:
        'Returns LSP SemanticTokens (delta-encoded 5-tuples) for the expression. Decode with the legend exported from the language service package.',
      inputSchema: {
        ...baseShape
      }
    },
    async ({ expression, uri }) => {
      try {
        const doc = buildDocument(expression, uri);
        const result = ls.getSemanticTokens({ textDocument: doc });
        return jsonResult(result);
      } catch (err) {
        return errorResult(err);
      }
    }
  );

  server.registerTool(
    'expreszo_format',
    {
      title: 'Expreszo: format expression',
      description:
        'Format an expreszo expression using the built-in pretty-printer. Returns an array with at most one whole-document TextEdit, or an empty array if the document is already formatted or fails to parse.',
      inputSchema: {
        ...baseShape
      }
    },
    async ({ expression, uri }) => {
      try {
        const doc = buildDocument(expression, uri);
        const result = ls.format({ textDocument: doc });
        return jsonResult(result);
      } catch (err) {
        return errorResult(err);
      }
    }
  );

  server.registerTool(
    'expreszo_prepare_rename',
    {
      title: 'Expreszo: prepare rename',
      description:
        'Returns the source range of the symbol at the given position if it is renameable, or null when the cursor is on a built-in function name, constant, keyword, or any non-identifier token. Call this before expreszo_rename to confirm the operation is valid and to learn which text range will be replaced.',
      inputSchema: {
        ...baseShape,
        ...positionFieldShape
      }
    },
    async ({ expression, uri, position }) => {
      try {
        const doc = buildDocument(expression, uri);
        const result = ls.prepareRename({
          textDocument: doc,
          position: resolvePosition(doc, position as PositionInput)
        });
        return jsonResult(result);
      } catch (err) {
        return errorResult(err);
      }
    }
  );

  server.registerTool(
    'expreszo_rename',
    {
      title: 'Expreszo: rename symbol',
      description:
        'Renames the identifier at the given position to `newName`, returning an LSP WorkspaceEdit that replaces every body reference AND every lambda / function-def parameter declaration site in a single edit. Returns null when the cursor is not on a renameable identifier (built-in functions and constants are rejected) or when the document fails to parse.',
      inputSchema: {
        ...baseShape,
        ...positionFieldShape,
        newName: z.string().min(1).describe('The replacement identifier. Must be non-empty; callers are responsible for ensuring it is a valid expreszo identifier.')
      }
    },
    async ({ expression, uri, position, newName }) => {
      try {
        const doc = buildDocument(expression, uri);
        const result = ls.rename({
          textDocument: doc,
          position: resolvePosition(doc, position as PositionInput),
          newName
        });
        return jsonResult(result);
      } catch (err) {
        return errorResult(err);
      }
    }
  );

  server.registerTool(
    'expreszo_get_inlay_hints',
    {
      title: 'Expreszo: get inlay hints',
      description:
        'Returns LSP InlayHint entries for parameter-name labels at each argument of every built-in function call with two or more documented parameters. For example, `pow(2, 8)` yields hints `base:` before `2` and `exp:` before `8`. Single-parameter functions (sin, abs, ...) are intentionally skipped. Pass an optional `range` to limit hints to a subregion.',
      inputSchema: {
        ...baseShape,
        range: rangeSchema.optional().describe('Optional viewport range; hints outside it are omitted. When omitted, hints for the whole expression are returned.')
      }
    },
    async ({ expression, uri, range }) => {
      try {
        const doc = buildDocument(expression, uri);
        const result = ls.getInlayHints({
          textDocument: doc,
          range
        });
        return jsonResult(result);
      } catch (err) {
        return errorResult(err);
      }
    }
  );
}
