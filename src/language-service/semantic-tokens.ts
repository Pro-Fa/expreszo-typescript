import type { TextDocument } from 'vscode-languageserver-textdocument';
import type { SemanticTokens } from 'vscode-languageserver-types';
import type { HighlightToken } from './language-service.types';

/**
 * Stable legend mapping from `HighlightToken.type` to semantic-token type
 * index. Ordering is part of the public contract — clients decode by index,
 * so new entries must be appended, not inserted.
 */
export const SEMANTIC_TOKENS_LEGEND = {
  tokenTypes: [
    'keyword',
    'function',
    'variable',
    'namespace',
    'number',
    'string',
    'operator',
    'comment'
  ] as const,
  tokenModifiers: [] as readonly string[]
};

// Punctuation (parens, commas, braces) is intentionally absent — the LSP
// semantic-token protocol has no standard punctuation type, and tagging
// punctuation as 'operator' causes editors to highlight it incorrectly.
const HIGHLIGHT_TYPE_TO_INDEX: Partial<Record<HighlightToken['type'], number>> = {
  keyword: 0,
  function: 1,
  name: 2,
  constant: 3,
  number: 4,
  string: 5,
  operator: 6,
  comment: 7
};

export function encodeSemanticTokens(
  doc: TextDocument,
  highlightTokens: readonly HighlightToken[]
): SemanticTokens {
  // Convert each highlight token to (line, startChar, length, type, mods)
  type Entry = { line: number; startChar: number; length: number; type: number };
  const entries: Entry[] = [];
  for (const t of highlightTokens) {
    const typeIndex = HIGHLIGHT_TYPE_TO_INDEX[t.type];
    if (typeIndex === undefined) continue; // e.g. punctuation — no semantic type
    const start = doc.positionAt(t.start);
    const end = doc.positionAt(t.end);
    if (start.line === end.line) {
      entries.push({
        line: start.line,
        startChar: start.character,
        length: end.character - start.character,
        type: typeIndex
      });
      continue;
    }
    // LSP semantic tokens can't span multiple lines — `length` is measured
    // within the start line. Split the token into one entry per covered line.
    const slice = doc.getText({ start, end });
    const lines = slice.split(/\r\n|\r|\n/);
    let line = start.line;
    let char = start.character;
    for (const piece of lines) {
      if (piece.length > 0) {
        entries.push({ line, startChar: char, length: piece.length, type: typeIndex });
      }
      line++;
      char = 0;
    }
  }

  entries.sort((a, b) => a.line - b.line || a.startChar - b.startChar);

  const data: number[] = [];
  let prevLine = 0;
  let prevChar = 0;
  for (const e of entries) {
    const deltaLine = e.line - prevLine;
    const deltaStart = deltaLine === 0 ? e.startChar - prevChar : e.startChar;
    data.push(deltaLine, deltaStart, e.length, e.type, 0);
    prevLine = e.line;
    prevChar = e.startChar;
  }

  return { data };
}
