import type { TextDocument } from 'vscode-languageserver-textdocument';
import type { Location, Position } from 'vscode-languageserver-types';
import type { ParseCache } from './shared/parse-cache.js';
import { findNodeAt } from './shared/node-at-position.js';
import { getRootNode } from './shared/positioned-symbols.js';
import { spanToRange } from './shared/positions.js';
import { walk } from '../ast/visitor.js';
import type { Node } from '../ast/nodes.js';

function findTargetName(path: Node[]): string | null {
  for (let i = path.length - 1; i >= 0; i--) {
    const n = path[i];
    if (n.type === 'Ident' || n.type === 'NameRef') return n.name;
  }
  return null;
}

function collectLocations(
  doc: TextDocument,
  parseCache: ParseCache,
  position: Position
): { target: string; locations: Location[] } | null {
  const { expression } = parseCache.get(doc);
  if (!expression) return null;

  const offset = doc.offsetAt(position);
  const path = findNodeAt(expression, offset);
  const target = findTargetName(path);
  if (!target) return null;

  const root = getRootNode(expression);
  const locations: Location[] = [];
  walk(root, (n) => {
    if ((n.type === 'Ident' || n.type === 'NameRef') && n.name === target) {
      locations.push({ uri: doc.uri, range: spanToRange(doc, n.span) });
    }
  });

  return { target, locations };
}

export function getDefinition(
  doc: TextDocument,
  parseCache: ParseCache,
  position: Position
): Location | null {
  const result = collectLocations(doc, parseCache, position);
  if (!result || result.locations.length === 0) return null;
  return result.locations[0];
}

export function getReferences(
  doc: TextDocument,
  parseCache: ParseCache,
  position: Position
): Location[] {
  const result = collectLocations(doc, parseCache, position);
  return result ? result.locations : [];
}
