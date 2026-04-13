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

export function createParseCache(parser: Parser): ParseCache {
  const cache = new Map<string, ParseResult>();

  return {
    get(doc: TextDocument): ParseResult {
      const text = doc.getText();
      const key = doc.uri + '@' + doc.version + '@' + text.length + '@' + text;
      const hit = cache.get(key);
      if (hit) {
        return hit;
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
      cache.set(key, result);
      return result;
    }
  };
}
