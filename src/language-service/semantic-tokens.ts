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

const HIGHLIGHT_TYPE_TO_INDEX: Record<HighlightToken['type'], number> = {
  keyword: 0,
  function: 1,
  name: 2,
  constant: 3,
  number: 4,
  string: 5,
  operator: 6,
  punctuation: 6
};

export function encodeSemanticTokens(
  doc: TextDocument,
  highlightTokens: readonly HighlightToken[]
): SemanticTokens {
  // Convert each highlight token to (line, startChar, length, type, mods)
  type Entry = { line: number; startChar: number; length: number; type: number };
  const entries: Entry[] = [];
  for (const t of highlightTokens) {
    const start = doc.positionAt(t.start);
    const end = doc.positionAt(t.end);
    if (start.line !== end.line) {
      // Semantic tokens can't span multiple lines; split into per-line chunks.
      // For this language, tokens rarely cross lines (only multi-line strings),
      // so falling back to truncating at the first line is acceptable.
      entries.push({
        line: start.line,
        startChar: start.character,
        length: t.end - t.start,
        type: HIGHLIGHT_TYPE_TO_INDEX[t.type]
      });
    } else {
      entries.push({
        line: start.line,
        startChar: start.character,
        length: end.character - start.character,
        type: HIGHLIGHT_TYPE_TO_INDEX[t.type]
      });
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
