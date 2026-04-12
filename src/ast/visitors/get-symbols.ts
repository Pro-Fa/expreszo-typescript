/**
 * Collect the symbol (variable / function / member chain) names referenced by
 * an AST. Matches the legacy `src/core/get-symbols.ts` output order and
 * deduplication on the existing test corpus.
 *
 * The legacy implementation walks the RPN stream in post-order and keeps a
 * `prevVar` accumulator: consecutive `IVAR`/`IMEMBER` instructions extend it
 * into a dotted path, and any "other" instruction flushes it into the output
 * list. `IEXPR` sub-streams get their own fresh `prevVar` (which is flushed
 * when the sub-stream ends). This visitor mirrors that state machine: it
 * walks the AST in the same order the parser emitted the RPN and replays the
 * same flush semantics so the resulting order is byte-identical.
 *
 * Phase 2 drops this quirk — the AST-native replacement returns a stable
 * declaration-order list and updates the expected fixtures.
 */
import type { Node, Member, Ident, NameRef, ObjectProperty, ObjectSpread } from '../nodes.js';

export interface GetSymbolsOptions {
  readonly withMembers?: boolean;
}

interface WalkState {
  readonly out: string[];
  readonly withMembers: boolean;
  prevVar: string | null;
}

function pushUnique(list: string[], name: string): void {
  if (list.indexOf(name) === -1) list.push(name);
}

/** "IVAR" / "IVARNAME" legacy semantics. */
function visitName(state: WalkState, name: string): void {
  if (!state.withMembers) {
    pushUnique(state.out, name);
    return;
  }
  if (state.prevVar !== null) {
    pushUnique(state.out, state.prevVar);
  }
  state.prevVar = name;
}

/**
 * Walk a `Member` chain, mirroring the RPN sequence `IVAR obj, IMEMBER a,
 * IMEMBER b, ...`. Returns `true` if the chain was rooted on an identifier
 * (meaning the caller has already accounted for it via `prevVar` updates);
 * `false` if the object sub-tree was non-trivial and a generic recursion
 * should take over.
 */
function visitMemberChain(state: WalkState, node: Member): boolean {
  const segments: string[] = [node.property];
  let current: Node = node.object;
  while (current.type === 'Member') {
    segments.unshift(current.property);
    current = current.object;
  }
  if (current.type === 'Ident' || current.type === 'NameRef') {
    if (state.withMembers) {
      visitName(state, current.name);
      state.prevVar = state.prevVar + '.' + segments.join('.');
    } else {
      visitName(state, current.name);
      // `IMEMBER` instructions are a no-op in !withMembers mode.
    }
    return true;
  }
  return false;
}

/** "Other" (non-IVAR/IMEMBER/IEXPR) instruction — flush prevVar. */
function flush(state: WalkState): void {
  if (state.withMembers && state.prevVar !== null) {
    pushUnique(state.out, state.prevVar);
    state.prevVar = null;
  }
}

function walk(node: Node, state: WalkState): void {
  switch (node.type) {
    case 'NumberLit':
    case 'StringLit':
    case 'BoolLit':
    case 'NullLit':
    case 'UndefinedLit':
    case 'RawLit':
      flush(state);
      return;
    case 'Ident':
      visitName(state, (node as Ident).name);
      return;
    case 'NameRef':
      visitName(state, (node as NameRef).name);
      return;
    case 'Member':
      if (visitMemberChain(state, node)) return;
      walk(node.object, state);
      flush(state); // IMEMBER off a non-ident base — legacy flushes.
      return;
    case 'ArrayLit':
      for (const el of node.elements) {
        if (el.type === 'ArraySpread') {
          walk(el.argument, state);
        } else {
          walk(el, state);
        }
      }
      flush(state);
      return;
    case 'ObjectLit':
      for (const entry of node.properties) {
        if ('type' in entry && (entry as any).type === 'ObjectSpread') {
          walk((entry as ObjectSpread).argument, state);
        } else {
          walk((entry as ObjectProperty).value, state);
        }
        flush(state);
      }
      flush(state);
      return;
    case 'Unary':
      walk(node.operand, state);
      flush(state);
      return;
    case 'Binary':
      walk(node.left, state);
      walk(node.right, state);
      flush(state);
      return;
    case 'Ternary':
      walk(node.a, state);
      walk(node.b, state);
      walk(node.c, state);
      flush(state);
      return;
    case 'Call':
      walk(node.callee, state);
      for (const a of node.args) walk(a, state);
      flush(state);
      return;
    case 'Lambda':
      walk(node.body, state);
      flush(state);
      return;
    case 'FunctionDef':
      visitName(state, node.name);
      walk(node.body, state);
      flush(state);
      return;
    case 'Case': {
      if (node.subject) walk(node.subject, state);
      for (const arm of node.arms) {
        walk(arm.when, state);
        walk(arm.then, state);
      }
      if (node.else) walk(node.else, state);
      flush(state);
      return;
    }
    case 'Sequence':
      for (const s of node.statements) walk(s, state);
      flush(state);
      return;
    case 'Paren': {
      // `IEXPR` recurses with a fresh `prevVar` state; any accumulator the
      // inner walk leaves behind is flushed before the outer walk resumes.
      const savedPrev = state.prevVar;
      state.prevVar = null;
      walk(node.inner, state);
      flush(state);
      state.prevVar = savedPrev;
      return;
    }
    default: {
      const exhaustive: never = node;
      throw new Error('getSymbols: unhandled node kind ' + String((exhaustive as Node).type));
    }
  }
}

export function getSymbolsFromNode(
  node: Node,
  out: string[],
  options?: GetSymbolsOptions
): void {
  const state: WalkState = {
    out,
    withMembers: !!(options && options.withMembers),
    prevVar: null
  };
  walk(node, state);
  // Final flush — legacy does the same after the outer loop.
  flush(state);
}
