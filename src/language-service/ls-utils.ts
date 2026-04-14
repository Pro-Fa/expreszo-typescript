import { Value } from '../types';
import { Parser } from '../parsing/parser';
import { TEOF, Token, TokenStream } from '../parsing';

/**
 * Returns a human-readable type name for a value.
 *
 * @param value - The value to get the type name for
 * @returns A string describing the type: 'null', 'array', 'function', 'object',
 *          'string', 'number', 'boolean', or 'undefined'
 *
 * @example
 * ```ts
 * valueTypeName(null)        // 'null'
 * valueTypeName([1, 2, 3])   // 'array'
 * valueTypeName({ a: 1 })    // 'object'
 * valueTypeName('hello')     // 'string'
 * ```
 */
export function valueTypeName(value: Value): string {
  const t = typeof value;
  switch (true) {
    case value === null:
      return 'null';
    case Array.isArray(value):
      return 'array';
    case t === 'function':
      return 'function';
    case t === 'object':
      return 'object';
    default:
      return t as string;
  }
}

/**
 * Checks if a character is valid within a property path.
 *
 * Valid path characters include alphanumerics, underscore, dollar sign,
 * dot (for property access), and square brackets (for array indexing).
 *
 * @param ch - The character to check
 * @returns `true` if the character can appear in a property path
 *
 * @example
 * ```ts
 * isPathChar('a')  // true
 * isPathChar('.')  // true
 * isPathChar('[')  // true
 * isPathChar(' ')  // false
 * ```
 */
export function isPathChar(ch: string): boolean {
  // Include square brackets to keep array selectors within the detected prefix
  // eslint-disable-next-line no-useless-escape
  return /[A-Za-z0-9_$.\[\]]/.test(ch);
}

/**
 * Extracts a property path prefix from text at a given position.
 *
 * Scans backward from the position to find the start of a property path,
 * useful for providing completions when the user is typing a variable
 * or property access expression.
 *
 * @param text - The full text to extract from
 * @param position - The cursor position (0-based offset)
 * @returns An object with `start` (the starting offset of the path) and
 *          `prefix` (the extracted path string)
 *
 * @example
 * ```ts
 * extractPathPrefix('user.name', 9)
 * // { start: 0, prefix: 'user.name' }
 *
 * extractPathPrefix('x + user.na', 11)
 * // { start: 4, prefix: 'user.na' }
 * ```
 */
export function extractPathPrefix(text: string, position: number): { start: number; prefix: string } {
  const i = Math.max(0, Math.min(position, text.length));
  let start = i;
  while (start > 0 && isPathChar(text[start - 1])) {
    start--;
  }
  return { start, prefix: text.slice(start, i) };
}

/**
 * Converts a value to a truncated JSON string for display in hover previews.
 *
 * Limits output to prevent overwhelming the UI with large data structures.
 * If the value exceeds the limits, the output is truncated with '...'.
 *
 * @param value - The value to convert to JSON
 * @param maxLines - Maximum number of lines to include (default: 3)
 * @param maxWidth - Maximum characters per line (default: 50)
 * @returns A truncated JSON string, or '<unserializable>' if conversion fails,
 *          or '<empty>' if the result is empty
 *
 * @example
 * ```ts
 * toTruncatedJsonString({ a: 1 })
 * // '{\n  "a": 1\n}'
 *
 * toTruncatedJsonString(veryLargeObject)
 * // '{\n  "key1": "value1",\n  "key2": "value2"...'
 * ```
 */
export function toTruncatedJsonString(value: unknown, maxLines = 3, maxWidth = 50): string {
  let text: string;
  try {
    text = JSON.stringify(value, null, 2) as string;
  } catch {
    return '<unserializable>';
  }
  if (!text) {
    return '<empty>';
  }

  const sourceLines = text.split('\n');
  const truncatedLineCount = sourceLines.length > maxLines;
  const kept = sourceLines.slice(0, maxLines);

  let truncatedAnyLine = false;
  const clipped = kept.map((line) => {
    if (line.length > maxWidth) {
      truncatedAnyLine = true;
      return line.slice(0, maxWidth) + '...';
    }
    return line;
  });

  const joined = clipped.join('\n');
  return truncatedLineCount || truncatedAnyLine ? joined + '...' : joined;
}

/**
 * Creates a TokenStream for tokenizing expression text.
 *
 * @param parser - The parser instance to use for tokenization
 * @param text - The expression text to tokenize
 * @returns A TokenStream that can be iterated to get tokens
 *
 * @example
 * ```ts
 * const parser = new Parser();
 * const stream = makeTokenStream(parser, '2 + x');
 * ```
 */
export function makeTokenStream(parser: Parser, text: string): TokenStream {
  return new TokenStream(parser, text);
}

/**
 * Token span information including the token and its position in the source.
 */
export interface TokenSpan {
  /** The token object */
  token: Token;
  /** Start offset in the source text (0-based) */
  start: number;
  /** End offset in the source text (exclusive) */
  end: number;
}

/**
 * Iterates through all tokens in a TokenStream, collecting position information.
 *
 * Useful for syntax highlighting and finding the token at a specific position.
 * Can optionally stop early when reaching a specified position.
 *
 * @param ts - The TokenStream to iterate
 * @param untilPos - Optional position to stop at (will include the token containing this position)
 * @returns An array of token spans with start/end positions
 *
 * @example
 * ```ts
 * const parser = new Parser();
 * const stream = makeTokenStream(parser, '2 + x * 3');
 * const spans = iterateTokens(stream);
 * // Returns spans for: 2, +, x, *, 3
 *
 * // Stop early at position 5
 * const partialSpans = iterateTokens(stream, 5);
 * // Returns spans for: 2, +, x
 * ```
 */
export function iterateTokens(ts: TokenStream, untilPos?: number): TokenSpan[] {
  const spans: TokenSpan[] = [];
  while (true) {
    const t = ts.next();
    if (t.type === TEOF) {
      break;
    }
    const start = t.index;
    const end = ts.pos; // pos advanced to end of current token in TokenStream
    spans.push({ token: t, start, end });
    if (untilPos != null && end >= untilPos) {
      // We can stop early if we reached the position
      break;
    }
  }
  return spans;
}

export interface CommentSpan {
  start: number;
  end: number;
}

/**
 * Scan an expression source for line comments and block comments.
 * The parser strips comments before they reach the token stream, so the
 * language service rescans the raw text to emit comment highlights and
 * semantic tokens. String literals are skipped so sequences like `"// not a
 * comment"` are not reported.
 */
export function findCommentSpans(text: string): CommentSpan[] {
  const spans: CommentSpan[] = [];
  const n = text.length;
  let i = 0;
  while (i < n) {
    const c = text.charCodeAt(i);
    // 0x22 = '"', 0x27 = "'"
    if (c === 0x22 || c === 0x27) {
      const quote = c;
      i++;
      while (i < n && text.charCodeAt(i) !== quote) {
        if (text.charCodeAt(i) === 0x5c && i + 1 < n) i += 2; // '\\'
        else i++;
      }
      if (i < n) i++;
      continue;
    }
    if (c === 0x2f && i + 1 < n) {
      const next = text.charCodeAt(i + 1);
      if (next === 0x2f) {
        const start = i;
        i += 2;
        while (i < n && text.charCodeAt(i) !== 0x0a) i++;
        spans.push({ start, end: i });
        continue;
      }
      if (next === 0x2a) {
        const start = i;
        i += 2;
        while (i + 1 < n && !(text.charCodeAt(i) === 0x2a && text.charCodeAt(i + 1) === 0x2f)) i++;
        if (i + 1 < n) i += 2;
        else i = n;
        spans.push({ start, end: i });
        continue;
      }
    }
    i++;
  }
  return spans;
}
