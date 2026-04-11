/**
 * Shared types for the sync/async evaluator split introduced in Phase 3.
 *
 * The Phase-2 unified `evaluateAst` returned `Value | Promise<Value>` and
 * propagated promises through a `then` helper. Phase 3 splits that into two
 * explicit paths:
 *
 *   - `SyncEvaluator` returns `Value` directly. If it ever encounters a
 *     thenable at a `Call` boundary, it throws `AsyncRequiredError` so the
 *     caller can retry on the async path.
 *   - `AsyncEvaluator` returns `Promise<Value>` end-to-end and handles
 *     promises natively via `await`.
 *
 * `Expression.evaluate()` uses the `async-analysis` visitor to decide which
 * path to take up front, and catches `AsyncRequiredError` as a safety net for
 * functions registered via the runtime scope path (where descriptor metadata
 * is not available).
 */
import type { Value } from '../types/values.js';

/**
 * Alias preserved for future narrowing — today it is identical to `Value`
 * but keeps the evaluator free to swap in a tighter union (e.g. excluding
 * `Promise`) once the async split is complete.
 */
export type EvalValue = Value;

/**
 * Thrown by `SyncEvaluator` when a `Call` produces a thenable. The top-level
 * `Expression.evaluate()` catches this and retries on the async path,
 * caching the result so subsequent calls skip straight to the async
 * evaluator.
 */
export class AsyncRequiredError extends Error {
  constructor() {
    super(
      'Synchronous evaluator encountered an asynchronous value. ' +
      'Retry via the async path.'
    );
    this.name = 'AsyncRequiredError';
  }
}

export function isPromiseLike(value: unknown): value is PromiseLike<unknown> {
  return (
    value !== null &&
    value !== undefined &&
    (typeof value === 'object' || typeof value === 'function') &&
    typeof (value as { then?: unknown }).then === 'function'
  );
}
