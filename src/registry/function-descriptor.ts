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

/**
 * Human-readable docs for a single function parameter. Consumed by the
 * language service for hover/completion arity and placeholder rendering.
 */
export interface FunctionParamDoc {
  readonly name: string;
  readonly description: string;
  readonly optional?: boolean;
  readonly isVariadic?: boolean;
}

/**
 * Doc block attached to a `FunctionDescriptor`. Phase 4 merged the legacy
 * `BUILTIN_FUNCTION_DOCS` map into descriptors so the registry is the single
 * source of truth the language service reads from.
 */
export interface FunctionDocs {
  readonly description: string;
  readonly params?: readonly FunctionParamDoc[];
}

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
   * untrusted expressions. The validator builds its allow-list from every
   * descriptor with `safe: true`; there is no separate allow-list anywhere.
   */
  readonly safe: boolean;
  /**
   * Whether the function ever returns a promise. The async-analysis visitor
   * uses this to route evaluation to the sync or async evaluator without
   * runtime duck-typing. All current built-ins are sync.
   */
  readonly async: boolean;
  /**
   * Optional language-service documentation. If omitted, the language
   * service falls back to generic `name(arg1, …)` rendering.
   */
  readonly docs?: FunctionDocs;
}
