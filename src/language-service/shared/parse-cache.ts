import type { TextDocument } from 'vscode-languageserver-textdocument';
import type { Parser } from '../../parsing/parser.js';
import type { Expression } from '../../core/expression.js';
import { ParseError } from '../../types/errors.js';

export interface ParseResult {
  expression: Expression | null;
  parseError: ParseError | Error | null;
}

export interface ParseCache {
  get(doc: TextDocument): ParseResult;
}

interface Entry {
  version: number;
  text: string;
  result: ParseResult;
}

export function createParseCache(parser: Parser): ParseCache {
  // One entry per URI — a newer version (or replaced content) evicts the
  // previous result, so the cache stays bounded by the set of live documents.
  const cache = new Map<string, Entry>();

  return {
    get(doc: TextDocument): ParseResult {
      const text = doc.getText();
      const hit = cache.get(doc.uri);
      if (hit && hit.version === doc.version && hit.text === text) {
        return hit.result;
      }
      let result: ParseResult;
      try {
        const expression = parser.parse(text);
        result = { expression, parseError: null };
      } catch (err) {
        if (err instanceof ParseError) {
          result = { expression: null, parseError: err };
        } else if (err instanceof Error) {
          result = { expression: null, parseError: err };
        } else {
          result = { expression: null, parseError: new Error(String(err)) };
        }
      }
      cache.set(doc.uri, { version: doc.version, text, result });
      return result;
    }
  };
}
