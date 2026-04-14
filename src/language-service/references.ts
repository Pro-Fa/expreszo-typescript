import type { TextDocument } from 'vscode-languageserver-textdocument';
import type { Location, Position, TextEdit, WorkspaceEdit } from 'vscode-languageserver-types';
import type { ParseCache } from './shared/parse-cache.js';
import { findNodeAt } from './shared/node-at-position.js';
import { getRootNode } from './shared/positioned-symbols.js';
import { spanToRange } from './shared/positions.js';
import { walk } from '../ast/visitor.js';
import type { Node, Lambda, FunctionDef } from '../ast/nodes.js';

function findTargetName(path: Node[]): string | null {
  for (let i = path.length - 1; i >= 0; i--) {
    const n = path[i];
    if (n.type === 'Ident' || n.type === 'NameRef') return n.name;
  }
  return null;
}

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * If `paramName` is declared as a parameter of an enclosing `Lambda` or
 * `FunctionDef` in `path`, return the source location of that declaration in
 * the lambda head (the text before the body). Returns null if not applicable.
 */
function findLambdaParamDef(
  doc: TextDocument,
  path: Node[],
  paramName: string
): Location | null {
  for (let i = path.length - 1; i >= 0; i--) {
    const n = path[i];
    if (n.type !== 'Lambda' && n.type !== 'FunctionDef') continue;
    const lambda = n as Lambda | FunctionDef;
    if (!lambda.params.includes(paramName)) continue;
    // The lambda head is the source text before the body starts.
    const text = doc.getText();
    const bodyStart = lambda.body.span.start;
    const head = text.slice(n.span.start, bodyStart);
    const re = new RegExp(`\\b${escapeRegex(paramName)}\\b`);
    const m = re.exec(head);
    if (!m) continue;
    const offset = n.span.start + m.index;
    return {
      uri: doc.uri,
      range: {
        start: doc.positionAt(offset),
        end: doc.positionAt(offset + paramName.length)
      }
    };
  }
  return null;
}

/**
 * Collect every lambda/functiondef parameter declaration site for `paramName`
 * across the entire AST. Used by rename so declaration sites are updated
 * alongside body references.
 */
function collectLambdaParamDeclarations(
  root: Node,
  doc: TextDocument,
  paramName: string
): Location[] {
  const text = doc.getText();
  const locations: Location[] = [];
  walk(root, (n) => {
    if (n.type !== 'Lambda' && n.type !== 'FunctionDef') return;
    const lambda = n as Lambda | FunctionDef;
    if (!lambda.params.includes(paramName)) return;
    const bodyStart = lambda.body.span.start;
    const head = text.slice(n.span.start, bodyStart);
    const re = new RegExp(`\\b${escapeRegex(paramName)}\\b`, 'g');
    let m: RegExpExecArray | null;
    while ((m = re.exec(head)) !== null) {
      const offset = n.span.start + m.index;
      locations.push({
        uri: doc.uri,
        range: {
          start: doc.positionAt(offset),
          end: doc.positionAt(offset + paramName.length)
        }
      });
    }
  });
  return locations;
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
  const { expression } = parseCache.get(doc);
  if (!expression) return null;

  const offset = doc.offsetAt(position);
  const path = findNodeAt(expression, offset);
  const target = findTargetName(path);
  if (!target) return null;

  // If the cursor is inside a lambda/functiondef body and the target name is
  // one of the enclosing function's parameters, navigate to the declaration.
  const lambdaDef = findLambdaParamDef(doc, path, target);
  if (lambdaDef) return lambdaDef;

  // Fall back: first occurrence of the name in the AST.
  const root = getRootNode(expression);
  const locations: Location[] = [];
  walk(root, (n) => {
    if ((n.type === 'Ident' || n.type === 'NameRef') && n.name === target) {
      locations.push({ uri: doc.uri, range: spanToRange(doc, n.span) });
    }
  });

  return locations.length > 0 ? locations[0] : null;
}

export function getReferences(
  doc: TextDocument,
  parseCache: ParseCache,
  position: Position
): Location[] {
  const result = collectLocations(doc, parseCache, position);
  return result ? result.locations : [];
}

/**
 * Collect every location that must be updated when renaming `targetName`.
 * Includes all `Ident`/`NameRef` body references as well as every lambda /
 * functiondef parameter declaration site for that name.
 */
export function getRenameLocations(
  doc: TextDocument,
  parseCache: ParseCache,
  targetName: string
): Location[] {
  const { expression } = parseCache.get(doc);
  if (!expression) return [];

  const root = getRootNode(expression);
  const locations: Location[] = [];

  // Body references (Ident / NameRef nodes).
  walk(root, (n) => {
    if ((n.type === 'Ident' || n.type === 'NameRef') && n.name === targetName) {
      locations.push({ uri: doc.uri, range: spanToRange(doc, n.span) });
    }
  });

  // Parameter declaration sites (not represented as AST nodes).
  const decls = collectLambdaParamDeclarations(root, doc, targetName);
  locations.push(...decls);

  return locations;
}

/**
 * Build a `WorkspaceEdit` that replaces every occurrence of `targetName`
 * (body references + lambda parameter declarations) with `newName`.
 */
export function buildRenameEdit(
  doc: TextDocument,
  parseCache: ParseCache,
  targetName: string,
  newName: string
): WorkspaceEdit | null {
  const locations = getRenameLocations(doc, parseCache, targetName);
  if (locations.length === 0) return null;

  const edits: TextEdit[] = locations.map(loc => ({ range: loc.range, newText: newName }));
  return { changes: { [doc.uri]: edits } };
}
