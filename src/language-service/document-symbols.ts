import type { TextDocument } from 'vscode-languageserver-textdocument';
import type { DocumentSymbol } from 'vscode-languageserver-types';
import { SymbolKind } from 'vscode-languageserver-types';
import type { ParseCache } from './shared/parse-cache.js';
import { collectPositionedSymbols, type PositionedSymbol } from './shared/positioned-symbols.js';
import { spanToRange } from './shared/positions.js';

function kindFor(sym: PositionedSymbol): SymbolKind {
  if (sym.kind === 'function') return SymbolKind.Function;
  if (sym.kind === 'member') return SymbolKind.Field;
  return SymbolKind.Variable;
}

export function getDocumentSymbols(
  doc: TextDocument,
  parseCache: ParseCache
): DocumentSymbol[] {
  const { expression } = parseCache.get(doc);
  if (!expression) return [];

  const symbols = collectPositionedSymbols(expression);

  // One DocumentSymbol per unique (fullPath, kind); pick the first occurrence.
  const seen = new Map<string, PositionedSymbol>();
  for (const sym of symbols) {
    const key = sym.kind + ':' + sym.fullPath;
    if (!seen.has(key)) seen.set(key, sym);
  }

  const out: DocumentSymbol[] = [];
  for (const sym of seen.values()) {
    const range = spanToRange(doc, sym.span);
    out.push({
      name: sym.fullPath,
      kind: kindFor(sym),
      range,
      selectionRange: range
    });
  }
  return out;
}
