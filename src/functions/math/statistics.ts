/**
 * Statistical functions.
 * All aggregates return undefined when the input array is undefined,
 * contains an undefined element, or is empty.
 */

import { getTypeName } from '../../types/values.js';

function toNumericArray(name: string, array: unknown): number[] | undefined {
  if (array === undefined) {
    return undefined;
  }
  if (!Array.isArray(array)) {
    throw new Error(
      `${name}(array) expects an array as argument, got ${getTypeName(array)}.\n` +
      `Example: ${name}([1, 2, 3, 4])`
    );
  }
  if (array.length === 0) {
    return undefined;
  }
  const out: number[] = [];
  for (const v of array) {
    if (v === undefined) {
      return undefined;
    }
    if (typeof v !== 'number') {
      throw new Error(
        `${name}(array) expects an array of numbers, got ${getTypeName(v)} element.\n` +
        `Example: ${name}([1, 2, 3, 4])`
      );
    }
    out.push(v);
  }
  return out;
}

export function mean(array: (number | undefined)[] | undefined): number | undefined {
  const nums = toNumericArray('mean', array);
  if (nums === undefined) {
    return undefined;
  }
  let total = 0;
  for (const n of nums) {
    total += n;
  }
  return total / nums.length;
}

export function median(array: (number | undefined)[] | undefined): number | undefined {
  const nums = toNumericArray('median', array);
  if (nums === undefined) {
    return undefined;
  }
  const sorted = [...nums].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  if (sorted.length % 2 === 0) {
    return (sorted[mid - 1] + sorted[mid]) / 2;
  }
  return sorted[mid];
}

// "mode" in statistics; renamed to a self-documenting name.
// Works on any element type (strings, numbers, booleans). On ties,
// returns the value that first reached the highest count.
export function mostFrequent(array: any[] | undefined): any {
  if (array === undefined) {
    return undefined;
  }
  if (!Array.isArray(array)) {
    throw new Error(
      `mostFrequent(array) expects an array as argument, got ${getTypeName(array)}.\n` +
      'Example: mostFrequent([1, 2, 2, 3])'
    );
  }
  if (array.length === 0) {
    return undefined;
  }
  const counts = new Map<any, number>();
  let bestValue: any = array[0];
  let bestCount = 0;
  for (const v of array) {
    if (v === undefined) {
      return undefined;
    }
    const c = (counts.get(v) ?? 0) + 1;
    counts.set(v, c);
    if (c > bestCount) {
      bestCount = c;
      bestValue = v;
    }
  }
  return bestValue;
}

// Population variance: mean of squared deviations from the mean.
export function variance(array: (number | undefined)[] | undefined): number | undefined {
  const nums = toNumericArray('variance', array);
  if (nums === undefined) {
    return undefined;
  }
  let total = 0;
  for (const n of nums) {
    total += n;
  }
  const m = total / nums.length;
  let sumSq = 0;
  for (const n of nums) {
    const d = n - m;
    sumSq += d * d;
  }
  return sumSq / nums.length;
}

export function stddev(array: (number | undefined)[] | undefined): number | undefined {
  const v = variance(array);
  if (v === undefined) {
    return undefined;
  }
  return Math.sqrt(v);
}

// p is a percentage in [0, 100]. Uses linear interpolation between
// adjacent ranks (the C = 1 / "linear" definition used by NumPy default,
// Excel PERCENTILE.INC, and R type 7).
export function percentile(
  array: (number | undefined)[] | undefined,
  p: number | undefined
): number | undefined {
  if (p === undefined) {
    return undefined;
  }
  if (typeof p !== 'number' || !isFinite(p)) {
    throw new Error(
      `percentile(array, p) expects a finite number for p, got ${getTypeName(p)}.\n` +
      'Example: percentile([1, 2, 3, 4], 50)'
    );
  }
  if (p < 0 || p > 100) {
    throw new Error(
      `percentile(array, p) expects p between 0 and 100, got ${p}.\n` +
      'Example: percentile([1, 2, 3, 4], 50)'
    );
  }
  const nums = toNumericArray('percentile', array);
  if (nums === undefined) {
    return undefined;
  }
  const sorted = [...nums].sort((a, b) => a - b);
  if (sorted.length === 1) {
    return sorted[0];
  }
  const rank = (p / 100) * (sorted.length - 1);
  const lo = Math.floor(rank);
  const hi = Math.ceil(rank);
  if (lo === hi) {
    return sorted[lo];
  }
  return sorted[lo] + (sorted[hi] - sorted[lo]) * (rank - lo);
}
