/**
 * Collection-building array functions: range/chunk and set-style
 * operations (union, intersect) plus group/count aggregators.
 *
 * All predicate-style functions use the modern (array, fn) argument
 * order only — the dual-order compatibility shims in `operations.ts`
 * exist for functions that predate that convention.
 */

import { getTypeName } from '../../types/values.js';

export function range(
  start: number | undefined,
  end: number | undefined,
  step?: number
): number[] | undefined {
  if (start === undefined || end === undefined) {
    return undefined;
  }
  if (typeof start !== 'number' || typeof end !== 'number') {
    throw new Error(
      `range(start, end, step?) expects numbers, got ${getTypeName(start)} and ${getTypeName(end)}.\n` +
      'Example: range(0, 5) or range(0, 10, 2)'
    );
  }
  const s = step === undefined ? 1 : step;
  if (typeof s !== 'number') {
    throw new Error(
      `range(start, end, step) expects a numeric step, got ${getTypeName(step)}.\n` +
      'Example: range(0, 10, 2)'
    );
  }
  if (s === 0 || !isFinite(s)) {
    throw new Error('range(start, end, step) step must be a non-zero finite number.');
  }
  const result: number[] = [];
  if (s > 0) {
    for (let v = start; v < end; v += s) {
      result.push(v);
    }
  } else {
    for (let v = start; v > end; v += s) {
      result.push(v);
    }
  }
  return result;
}

export function chunk(
  a: any[] | undefined,
  size: number | undefined
): any[][] | undefined {
  if (a === undefined || size === undefined) {
    return undefined;
  }
  if (!Array.isArray(a)) {
    throw new Error(
      `chunk(array, size) expects an array as first argument, got ${getTypeName(a)}.\n` +
      'Example: chunk([1, 2, 3, 4, 5], 2)'
    );
  }
  if (typeof size !== 'number' || !Number.isInteger(size) || size < 1) {
    throw new Error(
      `chunk(array, size) expects a positive integer size, got ${getTypeName(size)} ${size}.\n` +
      'Example: chunk([1, 2, 3, 4, 5], 2)'
    );
  }
  const result: any[][] = [];
  for (let i = 0; i < a.length; i += size) {
    result.push(a.slice(i, i + size));
  }
  return result;
}

// Union of N arrays with duplicates removed. Preserves first-seen order.
// Equality uses Set semantics: strict equality for primitives, reference
// equality for objects/arrays — matches how `unique` already behaves.
export function union(...arrays: (any[] | undefined)[]): any[] | undefined {
  if (arrays.length === 0) {
    return [];
  }
  const seen = new Set<any>();
  const result: any[] = [];
  for (const a of arrays) {
    if (a === undefined) {
      return undefined;
    }
    if (!Array.isArray(a)) {
      throw new Error(
        `union(...arrays) expects arrays, got ${getTypeName(a)}.\n` +
        'Example: union([1, 2], [2, 3])'
      );
    }
    for (const v of a) {
      if (!seen.has(v)) {
        seen.add(v);
        result.push(v);
      }
    }
  }
  return result;
}

// Intersection of N arrays: elements present in every input, deduped,
// in the order they first appear in the first array.
export function intersect(...arrays: (any[] | undefined)[]): any[] | undefined {
  if (arrays.length === 0) {
    return [];
  }
  for (const a of arrays) {
    if (a === undefined) {
      return undefined;
    }
    if (!Array.isArray(a)) {
      throw new Error(
        `intersect(...arrays) expects arrays, got ${getTypeName(a)}.\n` +
        'Example: intersect([1, 2, 3], [2, 3, 4])'
      );
    }
  }
  const first = arrays[0] as any[];
  if (arrays.length === 1) {
    return Array.from(new Set(first));
  }
  const others = (arrays.slice(1) as any[][]).map((a) => new Set(a));
  const seen = new Set<any>();
  const result: any[] = [];
  for (const v of first) {
    if (seen.has(v)) {
      continue;
    }
    if (others.every((s) => s.has(v))) {
      seen.add(v);
      result.push(v);
    }
  }
  return result;
}

export function groupBy(
  a: any[] | undefined,
  fn: Function | undefined
): Record<string, any[]> | undefined {
  if (a === undefined) {
    return undefined;
  }
  if (!Array.isArray(a)) {
    throw new Error(
      `groupBy(array, keyFn) expects an array as first argument, got ${getTypeName(a)}.\n` +
      'Example: groupBy(users, u => u.role)'
    );
  }
  if (typeof fn !== 'function') {
    throw new Error(
      `groupBy(array, keyFn) expects a function as second argument, got ${getTypeName(fn)}.\n` +
      'Example: groupBy(users, u => u.role)'
    );
  }
  const result: Record<string, any[]> = {};
  for (let i = 0; i < a.length; i++) {
    const key = String(fn(a[i], i));
    if (!Object.prototype.hasOwnProperty.call(result, key)) {
      result[key] = [];
    }
    result[key].push(a[i]);
  }
  return result;
}

export function countBy(
  a: any[] | undefined,
  fn: Function | undefined
): Record<string, number> | undefined {
  if (a === undefined) {
    return undefined;
  }
  if (!Array.isArray(a)) {
    throw new Error(
      `countBy(array, keyFn) expects an array as first argument, got ${getTypeName(a)}.\n` +
      'Example: countBy(users, u => u.role)'
    );
  }
  if (typeof fn !== 'function') {
    throw new Error(
      `countBy(array, keyFn) expects a function as second argument, got ${getTypeName(fn)}.\n` +
      'Example: countBy(users, u => u.role)'
    );
  }
  const result: Record<string, number> = {};
  for (let i = 0; i < a.length; i++) {
    const key = String(fn(a[i], i));
    result[key] = (Object.prototype.hasOwnProperty.call(result, key) ? result[key] : 0) + 1;
  }
  return result;
}
