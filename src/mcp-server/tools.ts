import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { TextDocument } from 'vscode-languageserver-textdocument';
import type { LanguageServiceApi } from '../language-service/language-service.types.js';
import type { Values } from '../types/values.js';
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
        'Returns diagnostics (parse errors, invalid function arity) for an expreszo expression as LSP Diagnostic objects.',
      inputSchema: {
        ...baseShape
      }
    },
    async ({ expression, uri }) => {
      try {
        const doc = buildDocument(expression, uri);
        const result = ls.getDiagnostics({ textDocument: doc });
        return jsonResult(result);
      } catch (err) {
        return errorResult(err);
      }
    }
  );
}
