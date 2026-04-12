/**
 * Binary arithmetic operators
 * Handles basic mathematical operations: +, -, *, /, %, ^
 */

import { warnOnce } from '../../utils/deprecation.js';

export function add(a: any, b: any): any {
  if (a === undefined || b === undefined) {
    return undefined;
  }

  if (typeof a === 'number' && typeof b === 'number') {
    return a + b;
  }

  // String or mixed string/number: attempt numeric conversion
  if (
    (typeof a === 'string' || typeof b === 'string') &&
    (typeof a === 'string' || typeof a === 'number') &&
    (typeof b === 'string' || typeof b === 'number')
  ) {
    const numA = Number(a);
    const numB = Number(b);
    if (isNaN(numA) || isNaN(numB)) {
      return NaN;
    }
    return numA + numB;
  }

  throw new Error(`Cannot add values of types: ${typeof a} and ${typeof b}. Use | for concatenation or merge() for objects.`);
}

export function addLegacy(a: any, b: any): any {
  if (a === undefined || b === undefined) {
    return undefined;
  }

  if (typeof a === 'number' && typeof b === 'number') {
    return a + b;
  }

  if (
    (typeof a === 'string' || typeof b === 'string') &&
    (typeof a === 'string' || typeof a === 'number') &&
    (typeof b === 'string' || typeof b === 'number')
  ) {
    const numA = Number(a);
    const numB = Number(b);
    if (isNaN(numA) || isNaN(numB)) {
      warnOnce('add-string-concat', 'Using + for string concatenation is deprecated. Use the | operator instead.');
      return `${a}${b}`;
    }
    return numA + numB;
  }

  if (Array.isArray(a) && Array.isArray(b)) {
    warnOnce('add-array-concat', 'Using + for array concatenation is deprecated. Use the | operator instead.');
    return a.concat(b);
  }

  if (
    typeof a === 'object' &&
    typeof b === 'object' &&
    !Array.isArray(a) &&
    !Array.isArray(b)
  ) {
    warnOnce('add-object-merge', 'Using + for object merging is deprecated. Use merge() or spread syntax instead.');
    return { ...a, ...b };
  }

  throw new Error(`Cannot add values of incompatible types: ${typeof a} and ${typeof b}`);
}

export function sub(a: number | undefined, b: number | undefined): number | undefined {
  return a === undefined || b === undefined ? undefined : a - b;
}

export function mul(a: number | undefined, b: number | undefined): number | undefined {
  return a === undefined || b === undefined ? undefined : a * b;
}

export function div(a: number | undefined, b: number | undefined): number | undefined {
  if (a === undefined || b === undefined) return undefined;
  if (b === 0) throw new Error('Division by zero');
  return a / b;
}

export function divLegacy(a: number | undefined, b: number | undefined): number | undefined {
  if (a === undefined || b === undefined) return undefined;
  if (b === 0) {
    warnOnce('div-by-zero', 'Division by zero now throws an error. Enable legacy mode to preserve Infinity/NaN behavior.');
  }
  return a / b;
}

export function mod(a: number | undefined, b: number | undefined): number | undefined {
  return a === undefined || b === undefined ? undefined : a % b;
}

export function pow(a: number | undefined, b: number | undefined): number | undefined {
  return a === undefined || b === undefined ? undefined : Math.pow(a, b);
}
