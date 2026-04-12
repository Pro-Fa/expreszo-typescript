/**
 * Unary arithmetic operators
 * Handles unary mathematical operations: -, +, and basic math functions
 */
import type { Value } from '../../types';

/**
 * Negation operator - returns the negative of a number
 */
export function neg(a: number | undefined): number | undefined {
  return a === undefined ? undefined : -a;
}

/**
 * Positive operator - converts value to number
 * Overloaded for better type inference
 */
export function pos(a: undefined): undefined;
export function pos(a: number): number;
export function pos(a: string): number;
export function pos(a: boolean): number;
export function pos(a: Value): number | undefined;
export function pos(a: Value): number | undefined {
  if (a === undefined) {
    return undefined;
  }

  const result = Number(a);

  return isNaN(result) ? undefined : result;
}

export function abs(a: number | undefined): number | undefined {
  if (a === undefined) {
    return undefined;
  }

  return Math.abs(a);
}

export function ceil(a: number | undefined): number | undefined {
  if (a === undefined) {
    return undefined;
  }

  return Math.ceil(a);
}

export function floor(a: number | undefined): number | undefined {
  if (a === undefined) {
    return undefined;
  }

  return Math.floor(a);
}

export function round(a: number | undefined): number | undefined {
  if (a === undefined) {
    return undefined;
  }

  return Math.round(a);
}

const _sign: (x: number) => number = Math.sign || ((x: number) => ((x > 0 ? 1 : 0) - (x < 0 ? 1 : 0)) || +x);
export function sign(x: number | undefined): number | undefined {
  return x === undefined ? undefined : _sign(x);
}

export function sqrt(a: number | undefined): number | undefined {
  if (a === undefined) {
    return undefined;
  }

  return Math.sqrt(a);
}

const _trunc: (x: number) => number = Math.trunc || ((a: number) => a < 0 ? Math.ceil(a) : Math.floor(a));
export function trunc(a: number | undefined): number | undefined {
  return a === undefined ? undefined : _trunc(a);
}

const ONE_THIRD = 1 / 3;
const _cbrt: (x: number) => number = Math.cbrt || ((x: number) => x < 0 ? -Math.pow(-x, ONE_THIRD) : Math.pow(x, ONE_THIRD));
export function cbrt(x: number | undefined): number | undefined {
  return x === undefined ? undefined : _cbrt(x);
}

export function exp(a: number | undefined): number | undefined {
  if (a === undefined) {
    return undefined;
  }

  return Math.exp(a);
}

const _expm1: (x: number) => number = Math.expm1 || ((x: number) => Math.exp(x) - 1);
export function expm1(x: number | undefined): number | undefined {
  return x === undefined ? undefined : _expm1(x);
}

export function log(a: number | undefined): number | undefined {
  if (a === undefined) {
    return undefined;
  }

  return Math.log(a);
}

const _log1p: (x: number) => number = Math.log1p || ((x: number) => Math.log(1 + x));
export function log1p(x: number | undefined): number | undefined {
  return x === undefined ? undefined : _log1p(x);
}

const _log2: (x: number) => number = Math.log2 || ((x: number) => Math.log(x) / Math.LN2);
export function log2(x: number | undefined): number | undefined {
  return x === undefined ? undefined : _log2(x);
}

const _log10: (x: number) => number = Math.log10 || ((a: number) => Math.log(a) * Math.LOG10E);
export function log10(a: number | undefined): number | undefined {
  return a === undefined ? undefined : _log10(a);
}
