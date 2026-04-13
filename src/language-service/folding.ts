import type { TextDocument } from 'vscode-languageserver-textdocument';
import type { FoldingRange } from 'vscode-languageserver-types';
import type { ParseCache } from './shared/parse-cache.js';
import { getRootNode } from './shared/positioned-symbols.js';
import { walk } from '../ast/visitor.js';

export function getFoldingRanges(
  doc: TextDocument,
  parseCache: ParseCache
): FoldingRange[] {
  const { expression } = parseCache.get(doc);
  if (!expression) return [];

  const root = getRootNode(expression);
  const ranges: FoldingRange[] = [];

  walk(root, (n) => {
    if (n.type !== 'Case' && n.type !== 'ArrayLit' && n.type !== 'ObjectLit') {
      return;
    }
    const startLine = doc.positionAt(n.span.start).line;
    const endLine = doc.positionAt(n.span.end).line;
    if (endLine > startLine) {
      ranges.push({ startLine, endLine });
    }
  });

  return ranges;
}
