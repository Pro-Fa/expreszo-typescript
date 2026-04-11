/**
 * `OperatorDescriptor` — declarative metadata for a single operator.
 *
 * Phase 2 introduces descriptors as the source-of-truth for the Pratt parser
 * rewrite (P2.4). The existing `Parser` class still wires its own
 * `unaryOps` / `binaryOps` / `ternaryOps` records by hand — descriptors
 * currently mirror those records so callers can consume a typed catalog
 * without touching parser internals. P2.4 flips the direction: the Pratt
 * loop will read this array and build the parser on top of it, and the
 * legacy records become thin views.
 *
 * Precedence numbers are deliberately spaced by 10 to leave room for user-
 * registered operators to slot between built-ins without renumbering.
 */
import type { OperatorFunction } from '../types/parser.js';

/**
 * Operator precedence levels mirroring the existing hand-rolled recursive-
 * descent cascade in `src/parsing/parser-state.ts`. Higher numbers bind
 * tighter. The numeric gaps leave room for user extensions.
 *
 * The current cascade (loosest → tightest):
 *
 *   `;` sequence            → 0
 *   `=` assignment          → 10   (right-assoc)
 *   `?:` ternary            → 20   (right-assoc)
 *   `or` / `||`             → 30
 *   `and` / `&&`            → 40
 *   `== != < <= > >=` etc.  → 50
 *   `+` `-` `|`             → 60
 *   `*` `/` `%`             → 70
 *   `??` `as`               → 80   (coalesce binds tighter than multiply,
 *                                   matching `parseTerm → parseCoalesce`)
 *   unary prefix            → 90
 *   `^` exponent            → 100  (right-assoc)
 *   postfix `!`             → 110
 *   member / index / call   → 120
 */
export const Precedence = {
  Sequence: 0,
  Assignment: 10,
  Ternary: 20,
  Or: 30,
  And: 40,
  Comparison: 50,
  AddSub: 60,
  MulDiv: 70,
  Coalesce: 80,
  Prefix: 90,
  Exponent: 100,
  Postfix: 110,
  Member: 120
} as const;

export type PrecedenceLevel = typeof Precedence[keyof typeof Precedence];

/**
 * Where an operator attaches relative to its operand(s):
 *
 *   - `prefix`  — `op X`               (e.g. `-x`, `not x`, `sin x`)
 *   - `infix`   — `X op Y`             (e.g. `a + b`, `a and b`, `a[b]`)
 *   - `postfix` — `X op`               (e.g. `x!`)
 *   - `ternary` — `X op1 Y op2 Z`      (e.g. `a ? b : c`)
 *   - `mixfix`  — custom parser rule (e.g. `case ... when ... then ... end`)
 */
export type OperatorKind = 'prefix' | 'infix' | 'postfix' | 'ternary' | 'mixfix';

export type OperatorAssociativity = 'left' | 'right' | 'none';

/**
 * Descriptor for a unary / binary / ternary / mixfix operator.
 *
 * `impl` is the runtime function the legacy evaluator already calls through
 * `expr.binaryOps[symbol]` / `expr.unaryOps[symbol]` / `expr.ternaryOps[symbol]`.
 * Keeping the exact same function reference here means the descriptor catalog
 * and the legacy records are provably in-sync (see
 * `test/registry/descriptor-catalog.ts`).
 */
export interface OperatorDescriptor {
  /** Source token the lexer emits for this operator (e.g. `+`, `and`, `as`). */
  readonly symbol: string;
  readonly kind: OperatorKind;
  readonly arity: 1 | 2 | 3;
  readonly precedence: PrecedenceLevel;
  readonly associativity: OperatorAssociativity;
  /**
   * Key used by `Parser.isOperatorEnabled` — maps `+` → `add`, `and` → `logical`,
   * etc. Mirrors `Parser.optionNameMap`. Optional: defaults to `symbol` when the
   * operator is not gateable.
   */
  readonly optionName?: string;
  /**
   * Whether the operator is safe to constant-fold in the simplify visitor.
   * Mirrors the behavior in `src/core/simplify.ts` which folds everything
   * except assignment. Set to `false` for `=` and anything with side effects.
   */
  readonly pure: boolean;
  /** Runtime implementation. Same reference the legacy parser registers. */
  readonly impl: OperatorFunction;
}
