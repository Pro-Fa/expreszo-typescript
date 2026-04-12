/**
 * Runtime validation helpers for expression evaluation.
 *
 * Security model:
 *
 *   1. Prototype pollution: `validateVariableName` / `validateMemberAccess`
 *      reject `__proto__`, `prototype`, `constructor` on any path.
 *   2. Function call allow-list: any function value reached through a
 *      variable, member access, or custom resolver must be either (a) the
 *      `impl` of a built-in descriptor with `safe: true`, (b) a pure
 *      built-in operator impl, (c) one of a small set of JavaScript
 *      natives (the standard `Math` surface), or (d) already registered in
 *      the parser's `functions` / `unaryOps` records. This blocks
 *      CVE-2025-12735 and issue #289 (scope-passed `eval`, `require`,
 *      `process.exit`, etc.).
 *
 * The descriptor-backed sets are built once at module load, so `isSafe`
 * is O(1).
 */
import { AccessError, FunctionError } from '../types/errors.js';
import type { OperatorFunction } from '../types/index.js';
import { BUILTIN_FUNCTIONS } from '../registry/builtin/functions.js';
import { ALL_OPERATORS } from '../registry/builtin/operators.js';
import { DANGEROUS_PROPERTIES } from './constants.js';
export { DANGEROUS_PROPERTIES };

/**
 * Every descriptor-declared safe built-in. Replaces the legacy hand-written
 * allow-list — adding a new safe function means adding a descriptor.
 */
const SAFE_BUILTIN_IMPLS: ReadonlySet<Function> = new Set<Function>([
  ...BUILTIN_FUNCTIONS.filter((d) => d.safe).map((d) => d.impl as unknown as Function),
  ...ALL_OPERATORS.filter((d) => d.pure).map((d) => d.impl as unknown as Function)
]);

/**
 * Small set of standard-library natives users may pass through scope (e.g.
 * `Parser.evaluate('fn.max(a, b)', { fn: { max: Math.max } })`). Kept
 * explicit so the rest of the JS global surface stays blocked.
 */
const SAFE_NATIVE_IMPLS: ReadonlySet<Function> = new Set<Function>([
  Math.abs, Math.acos, Math.asin, Math.atan, Math.atan2,
  Math.ceil, Math.cos, Math.exp, Math.floor, Math.log,
  Math.max, Math.min, Math.pow, Math.random, Math.round,
  Math.sin, Math.sqrt, Math.tan, Math.log10, Math.log2,
  Math.log1p, Math.expm1, Math.cosh, Math.sinh, Math.tanh,
  Math.acosh, Math.asinh, Math.atanh, Math.hypot, Math.trunc,
  Math.sign, Math.cbrt, Math.clz32, Math.imul, Math.fround
]);

export class ExpressionValidator {
  static validateVariableName(variableName: string, expressionString: string): void {
    if (DANGEROUS_PROPERTIES.has(variableName)) {
      throw new AccessError(
        'Prototype access detected',
        { propertyName: variableName, expression: expressionString }
      );
    }
  }

  static validateMemberAccess(propertyName: string, expressionString: string): void {
    if (DANGEROUS_PROPERTIES.has(propertyName)) {
      throw new AccessError(
        'Prototype access detected in member expression',
        { propertyName, expression: expressionString }
      );
    }
  }

  /**
   * True if `fn` is permitted to be called from an expression. Non-function
   * values pass through; functions must appear in a descriptor-backed set
   * or the parser's runtime registries.
   */
  private static registeredFunctionCache: WeakRef<Record<string, OperatorFunction>> | undefined;
  private static registeredFunctionSet: Set<Function> | undefined;

  static isAllowedFunction(fn: unknown, registeredFunctions: Record<string, OperatorFunction>): boolean {
    if (typeof fn !== 'function') return true;
    if (SAFE_BUILTIN_IMPLS.has(fn as Function)) return true;
    if (SAFE_NATIVE_IMPLS.has(fn as Function)) return true;

    let fnSet = ExpressionValidator.registeredFunctionSet;
    const cached = ExpressionValidator.registeredFunctionCache?.deref();
    if (cached !== registeredFunctions || !fnSet) {
      fnSet = new Set<Function>();
      for (const key in registeredFunctions) {
        if (Object.prototype.hasOwnProperty.call(registeredFunctions, key)) {
          const val = registeredFunctions[key];
          if (typeof val === 'function') fnSet.add(val as unknown as Function);
        }
      }
      ExpressionValidator.registeredFunctionCache = new WeakRef(registeredFunctions);
      ExpressionValidator.registeredFunctionSet = fnSet;
    }
    if (fnSet.has(fn as Function)) return true;

    // Cache may be stale if registeredFunctions was mutated (e.g. inline function defs).
    // Fall back to direct scan and update cache on hit.
    for (const key in registeredFunctions) {
      if (Object.prototype.hasOwnProperty.call(registeredFunctions, key) && registeredFunctions[key] === fn) {
        fnSet.add(fn as Function);
        return true;
      }
    }
    return false;
  }

  static validateAllowedFunction(
    fn: unknown,
    registeredFunctions: Record<string, OperatorFunction>,
    expressionString: string
  ): void {
    if (typeof fn === 'function' && !this.isAllowedFunction(fn, registeredFunctions)) {
      throw new FunctionError(
        'Calling unregistered functions is not allowed for security reasons',
        { expression: expressionString }
      );
    }
  }

  static validateFunctionCall(functionValue: unknown, functionName: string, expressionString: string): void {
    if (typeof functionValue !== 'function') {
      throw new FunctionError(
        `${functionValue} is not a function`,
        { functionName: String(functionValue), expression: expressionString }
      );
    }
  }

  static validateArrayAccess(parent: unknown, index: unknown): void {
    if (Array.isArray(parent) && !Number.isInteger(index)) {
      throw new Error(`Array can only be indexed with integers. Received: ${index}`);
    }
  }

  static validateRequiredParameter(value: unknown, parameterName: string): void {
    if (value === undefined || value === null) {
      throw new Error(`Required parameter '${parameterName}' is missing`);
    }
  }

  static validateStackParity(stackLength: number): void {
    if (stackLength > 1) {
      throw new Error('invalid Expression (parity)');
    }
  }
}
