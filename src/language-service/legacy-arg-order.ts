/**
 * Detects calls to dual-order built-in functions where the caller used the
 * legacy argument order instead of the preferred (collection-first) order.
 *
 * The runtime accepts both orderings for backwards compatibility, but the
 * preferred form is collection-first for consistency across the library. This
 * pass emits an Information-level diagnostic with `code: 'legacy-arg-order'`,
 * which the code-actions module turns into a "Reorder arguments" quick fix.
 *
 * Detection is intentionally conservative: we only flag a call when the AST
 * literal/lambda types make the legacy interpretation the ONLY valid reading.
 * Calls whose argument types are indeterminate (bare identifiers, member
 * access, nested calls) are left alone — the runtime will dispatch correctly
 * and flagging them would produce noisy false positives.
 */

import type { TextDocument } from 'vscode-languageserver-textdocument';
import type { Diagnostic } from 'vscode-languageserver-types';
import { DiagnosticSeverity } from 'vscode-languageserver-types';
import type { Call, Node, Span } from '../ast/nodes.js';
import type { ParseCache } from './shared/parse-cache.js';
import { walk } from '../ast/visitor.js';
import { getRootNode } from './shared/positioned-symbols.js';
import { spanToRange } from './shared/positions.js';

/** Spans of arguments that must be swapped to produce the preferred order. */
export interface LegacyArgOrderFixData {
  kind: 'legacy-arg-order';
  functionName: string;
  /** Ordered list of argument spans to swap. Length is either 2 or 3 (fold/reduce). */
  argSpans: Span[];
  /** For 3-arg swaps, the indices into argSpans that should swap (e.g. [0,2]). */
  swapPairs: [number, number][];
}

function isCallableLiteral(node: Node): boolean {
  return node.type === 'Lambda' || node.type === 'FunctionDef';
}

function isCollectionLiteral(node: Node): boolean {
  return node.type === 'ArrayLit' || node.type === 'StringLit';
}

/**
 * Returns true when the AST node's type excludes it from being a collection
 * at runtime. Used to prove the legacy reading of `indexOf` is the only valid one.
 */
function isDefinitelyNotCollection(node: Node): boolean {
  switch (node.type) {
    case 'NumberLit':
    case 'BoolLit':
    case 'NullLit':
    case 'UndefinedLit':
    case 'ObjectLit':
    case 'Lambda':
    case 'FunctionDef':
      return true;
    default:
      return false;
  }
}

type Detector = (call: Call) => LegacyArgOrderFixData | null;

/**
 * map / filter / find / some / every / sort: preferred (array, fn),
 * legacy (fn, array). A Lambda/FunctionDef in arg[0] is an unambiguous signal
 * of legacy order — no preferred call starts with a function literal.
 */
function detectCollectionFirstFn(name: string): Detector {
  return (call) => {
    if (call.args.length !== 2) return null;
    if (!isCallableLiteral(call.args[0])) return null;
    return {
      kind: 'legacy-arg-order',
      functionName: name,
      argSpans: [call.args[0].span, call.args[1].span],
      swapPairs: [[0, 1]]
    };
  };
}

/**
 * fold / reduce: preferred (array, initial, fn), legacy (fn, initial, array).
 * The initial value stays in place; arg[0] and arg[2] swap.
 */
function detectFoldLike(name: string): Detector {
  return (call) => {
    if (call.args.length !== 3) return null;
    if (!isCallableLiteral(call.args[0])) return null;
    return {
      kind: 'legacy-arg-order',
      functionName: name,
      argSpans: [call.args[0].span, call.args[1].span, call.args[2].span],
      swapPairs: [[0, 2]]
    };
  };
}

/**
 * indexOf: preferred (arrayOrString, target), legacy (target, arrayOrString).
 * Flag only when arg[0] is provably not a collection AND arg[1] is a literal
 * collection — that's the only case where the legacy reading is the sole
 * sensible interpretation.
 */
const detectIndexOf: Detector = (call) => {
  if (call.args.length !== 2) return null;
  if (!isDefinitelyNotCollection(call.args[0])) return null;
  if (!isCollectionLiteral(call.args[1])) return null;
  return {
    kind: 'legacy-arg-order',
    functionName: 'indexOf',
    argSpans: [call.args[0].span, call.args[1].span],
    swapPairs: [[0, 1]]
  };
};

/**
 * join: preferred (array, separator), legacy (separator, array). StringLit in
 * arg[0] combined with ArrayLit in arg[1] is unambiguously legacy.
 */
const detectJoin: Detector = (call) => {
  if (call.args.length !== 2) return null;
  if (call.args[0].type !== 'StringLit') return null;
  if (call.args[1].type !== 'ArrayLit') return null;
  return {
    kind: 'legacy-arg-order',
    functionName: 'join',
    argSpans: [call.args[0].span, call.args[1].span],
    swapPairs: [[0, 1]]
  };
};

const DETECTORS: Record<string, Detector> = {
  map: detectCollectionFirstFn('map'),
  filter: detectCollectionFirstFn('filter'),
  find: detectCollectionFirstFn('find'),
  some: detectCollectionFirstFn('some'),
  every: detectCollectionFirstFn('every'),
  sort: detectCollectionFirstFn('sort'),
  fold: detectFoldLike('fold'),
  reduce: detectFoldLike('reduce'),
  indexOf: detectIndexOf,
  join: detectJoin
};

function calleeName(callee: Node): string | null {
  if (callee.type === 'Ident' || callee.type === 'NameRef') return callee.name;
  return null;
}

export function getLegacyArgOrderDiagnostics(
  doc: TextDocument,
  parseCache: ParseCache
): Diagnostic[] {
  const { expression } = parseCache.get(doc);
  if (!expression) return [];

  const out: Diagnostic[] = [];
  const root = getRootNode(expression);

  walk(root, (node) => {
    if (node.type !== 'Call') return;
    const call = node as Call;
    const name = calleeName(call.callee);
    if (!name) return;

    const detector = DETECTORS[name];
    if (!detector) return;

    const data = detector(call);
    if (!data) return;

    out.push({
      range: spanToRange(doc, call.span),
      severity: DiagnosticSeverity.Information,
      message:
        `'${name}' is called with legacy argument order. ` +
        `The preferred order is collection-first. Use the quick fix to reorder.`,
      source: 'expreszo',
      code: 'legacy-arg-order',
      data
    });
  });

  return out;
}
