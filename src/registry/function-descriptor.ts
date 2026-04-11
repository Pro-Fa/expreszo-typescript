/**
 * `FunctionDescriptor` — declarative metadata for a single registered
 * function. Phase 2 introduces descriptors as the single source-of-truth the
 * Pratt parser, evaluator, validator, and language-service will all consume
 * in later phases. For now the descriptor list mirrors the hand-rolled
 * `Parser.functions` record and the `SAFE_MATH_FUNCTIONS` allow-list in
 * `src/validation/expression-validator.ts`; a catalog-parity test asserts the
 * three stay in lock-step until they're merged in Phase 4.
 */
import type { OperatorFunction } from '../types/parser.js';

/**
 * Categorization used by the language-service documentation grouping and the
 * `entries/` subpath build in Phase 5. Matches the directory layout under
 * `src/functions/`.
 */
export type FunctionCategory =
  | 'math'
  | 'array'
  | 'string'
  | 'object'
  | 'utility'
  | 'type-check';

export interface FunctionDescriptor {
  /** Name exposed to expressions (e.g. `max`, `indexOf`). */
  readonly name: string;
  /** Runtime implementation. Identical reference to the legacy registration. */
  readonly impl: OperatorFunction;
  readonly category: FunctionCategory;
  /**
   * Whether the simplify visitor is allowed to constant-fold a call to this
   * function when all arguments are literals. Should only be `true` when the
   * implementation is deterministic and free of observable side effects.
   * `random` is the canonical counter-example.
   */
  readonly pure: boolean;
  /**
   * Whether `ExpressionValidator` treats this function as safe to call from
   * untrusted expressions. Mirrors the `SAFE_MATH_FUNCTIONS` allow-list that
   * Phase 4 will delete once the validator walks descriptors directly.
   */
  readonly safe: boolean;
  /**
   * Whether the function ever returns a promise. The async-analysis visitor
   * in Phase 3 uses this to route evaluation to the sync or async evaluator
   * without runtime duck-typing. All current built-ins are sync.
   */
  readonly async: boolean;
}
