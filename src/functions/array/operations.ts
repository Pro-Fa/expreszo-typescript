/**
 * Array operation functions
 * Handles array manipulation and processing operations
 */

import { getTypeName } from '../../types/values.js';

export function filter(arg1: Function | any[] | undefined, arg2: Function | any[] | undefined): any[] | undefined {
  // Support both filter(array, fn) and filter(fn, array) for backwards compatibility
  // Early return for undefined first argument
  if (arg1 === undefined) {
    return undefined;
  }

  let f: Function;
  let a: any[] | undefined;

  if (Array.isArray(arg1) && typeof arg2 === 'function') {
    // array-first: filter(array, fn)
    a = arg1;
    f = arg2;
  } else if (typeof arg1 === 'function' && (Array.isArray(arg2) || arg2 === undefined)) {
    // function-first: filter(fn, array)
    f = arg1;
    a = arg2 as any[] | undefined;
  } else {
    throw new Error(
      'filter(array, predicate) expects an array and a function.\n' +
      'Example: filter([1, -2, 3], x => x > 0)'
    );
  }

  if (a === undefined) {
    return undefined;
  }
  return a.filter(function (x: any, i: number): any {
    return f(x, i);
  });
}

export function fold(arg1: Function | any[] | undefined, arg2: any, arg3: Function | any[] | undefined): any {
  // Support both fold(array, initial, fn) and fold(fn, initial, array) for backwards compatibility
  // Early return for undefined arguments
  if (arg1 === undefined) {
    return undefined;
  }

  let f: Function;
  let init: any;
  let a: any[] | undefined;

  if (Array.isArray(arg1) && typeof arg3 === 'function') {
    // array-first: fold(array, initial, fn)
    a = arg1;
    init = arg2;
    f = arg3;
  } else if (typeof arg1 === 'function' && (Array.isArray(arg3) || arg3 === undefined)) {
    // function-first: fold(fn, initial, array)
    f = arg1;
    init = arg2;
    a = arg3 as any[] | undefined;
  } else if (arg3 === undefined) {
    return undefined;
  } else {
    throw new Error(
      'fold(array, initial, reducer) expects an array, initial value, and a function.\n' +
      'Example: fold([1, 2, 3], 0, (acc, x) => acc + x)'
    );
  }

  if (a === undefined) {
    return undefined;
  }
  return a.reduce(function (acc: any, x: any, i: number): any {
    return f(acc, x, i);
  }, init);
}

export function indexOf(haystack: string | any[] | undefined, target: any): number | undefined {
  if (haystack === undefined) {
    return undefined;
  }
  if (!(Array.isArray(haystack) || typeof haystack === 'string')) {
    throw new Error(
      `indexOf(arrayOrString, target) expects a string or array as first argument, got ${getTypeName(haystack)}.\n` +
      'Example: indexOf(["a", "b", "c"], "b") or indexOf("hello", "o")'
    );
  }

  return haystack.indexOf(target);
}

export function indexOfLegacy(target: any, s: string | any[] | undefined): number | undefined {
  if (s === undefined) {
    return undefined;
  }
  if (!(Array.isArray(s) || typeof s === 'string')) {
    throw new Error(
      `indexOf(target, arrayOrString) expects a string or array as second argument, got ${getTypeName(s)}.\n` +
      'Example: indexOf("b", ["a", "b", "c"]) or indexOf("o", "hello")'
    );
  }

  return s.indexOf(target);
}

export function join(a: any[] | undefined, sep: string | undefined): string | undefined {
  if (a === undefined || sep === undefined) {
    return undefined;
  }
  if (!Array.isArray(a)) {
    throw new Error(
      `join(array, separator) expects an array as first argument, got ${getTypeName(a)}.\n` +
      'Example: join(["a", "b", "c"], ", ")'
    );
  }

  return a.join(sep);
}

export function joinLegacy(sep: string | undefined, a: any[] | undefined): string | undefined {
  if (sep === undefined || a === undefined) {
    return undefined;
  }
  if (!Array.isArray(a)) {
    throw new Error(
      `join(separator, array) expects an array as second argument, got ${getTypeName(a)}.\n` +
      'Example: join(", ", ["a", "b", "c"])'
    );
  }

  return a.join(sep);
}

export function map(arg1: Function | any[] | undefined, arg2: Function | any[] | undefined): any[] | undefined {
  // Support both map(array, fn) and map(fn, array) for backwards compatibility
  // Early return for undefined first argument
  if (arg1 === undefined) {
    return undefined;
  }

  let f: Function;
  let a: any[] | undefined;

  if (Array.isArray(arg1) && typeof arg2 === 'function') {
    // array-first: map(array, fn)
    a = arg1;
    f = arg2;
  } else if (typeof arg1 === 'function' && (Array.isArray(arg2) || arg2 === undefined)) {
    // function-first: map(fn, array)
    f = arg1;
    a = arg2 as any[] | undefined;
  } else {
    throw new Error(
      'map(array, mapper) expects an array and a function.\n' +
      'Example: map([1, 2, 3], x => x * 2)'
    );
  }

  if (a === undefined) {
    return undefined;
  }
  return a.map(function (x: any, i: number): any {
    return f(x, i);
  });
}

export function sum(array: (number | undefined)[] | undefined): number | undefined {
  if (array === undefined) {
    return undefined;
  }
  if (!Array.isArray(array)) {
    throw new Error(
      `sum(array) expects an array as argument, got ${getTypeName(array)}.\n` +
      'Example: sum([1, 2, 3, 4])'
    );
  }
  let total = 0;
  for (let i = 0; i < array.length; i++) {
    if (array[i] === undefined) return undefined;
    total += Number(array[i]);
  }
  return total;
}

export function count(array: any[] | undefined): number | undefined {
  if (array === undefined) {
    return undefined;
  }
  if (!Array.isArray(array)) {
    throw new Error(
      `count(array) expects an array as argument, got ${getTypeName(array)}.\n` +
      'Example: count([1, 2, 3, 4])'
    );
  }
  return array.length;
}

export function reduce(arg1: Function | any[] | undefined, arg2: any, arg3: Function | any[] | undefined): any {
  // reduce is an alias for fold - supports both argument orders
  return fold(arg1, arg2, arg3);
}

export function find(arg1: Function | any[] | undefined, arg2: Function | any[] | undefined): any {
  // Support both find(array, fn) and find(fn, array) for backwards compatibility
  // Early return for undefined first argument
  if (arg1 === undefined) {
    return undefined;
  }

  let f: Function;
  let a: any[] | undefined;

  if (Array.isArray(arg1) && typeof arg2 === 'function') {
    // array-first: find(array, fn)
    a = arg1;
    f = arg2;
  } else if (typeof arg1 === 'function' && (Array.isArray(arg2) || arg2 === undefined)) {
    // function-first: find(fn, array)
    f = arg1;
    a = arg2 as any[] | undefined;
  } else {
    throw new Error(
      'find(array, predicate) expects an array and a function.\n' +
      'Example: find([1, 2, 3, 4], x => x > 2)'
    );
  }

  if (a === undefined) {
    return undefined;
  }
  return a.find(function (x: any, i: number): any {
    return f(x, i);
  });
}

export function some(arg1: Function | any[] | undefined, arg2: Function | any[] | undefined): boolean | undefined {
  // Support both some(array, fn) and some(fn, array) for backwards compatibility
  // Early return for undefined first argument
  if (arg1 === undefined) {
    return undefined;
  }

  let f: Function;
  let a: any[] | undefined;

  if (Array.isArray(arg1) && typeof arg2 === 'function') {
    // array-first: some(array, fn)
    a = arg1;
    f = arg2;
  } else if (typeof arg1 === 'function' && (Array.isArray(arg2) || arg2 === undefined)) {
    // function-first: some(fn, array)
    f = arg1;
    a = arg2 as any[] | undefined;
  } else {
    throw new Error(
      'some(array, predicate) expects an array and a function.\n' +
      'Example: some([1, 2, 3, 4], x => x > 2)'
    );
  }

  if (a === undefined) {
    return undefined;
  }
  return a.some(function (x: any, i: number): any {
    return f(x, i);
  });
}

export function every(arg1: Function | any[] | undefined, arg2: Function | any[] | undefined): boolean | undefined {
  // Support both every(array, fn) and every(fn, array) for backwards compatibility
  // Early return for undefined first argument
  if (arg1 === undefined) {
    return undefined;
  }

  let f: Function;
  let a: any[] | undefined;

  if (Array.isArray(arg1) && typeof arg2 === 'function') {
    // array-first: every(array, fn)
    a = arg1;
    f = arg2;
  } else if (typeof arg1 === 'function' && (Array.isArray(arg2) || arg2 === undefined)) {
    // function-first: every(fn, array)
    f = arg1;
    a = arg2 as any[] | undefined;
  } else {
    throw new Error(
      'every(array, predicate) expects an array and a function.\n' +
      'Example: every([1, 2, 3, 4], x => x > 0)'
    );
  }

  if (a === undefined) {
    return undefined;
  }
  return a.every(function (x: any, i: number): any {
    return f(x, i);
  });
}

export function unique(a: any[] | undefined): any[] | undefined {
  if (a === undefined) {
    return undefined;
  }
  if (!Array.isArray(a)) {
    throw new Error(
      `unique(array) expects an array as argument, got ${getTypeName(a)}.\n` +
      'Example: unique([1, 2, 2, 3, 3, 3])'
    );
  }
  // Use Set to remove duplicates, then convert back to array
  return Array.from(new Set(a));
}

export function distinct(a: any[] | undefined): any[] | undefined {
  // distinct is an alias for unique
  return unique(a);
}

export function sort(arg1: any[] | Function | undefined, arg2?: Function | any[]): any[] | undefined {
  if (arg1 === undefined) return undefined;

  let a: any[];
  let comparator: Function | undefined;

  if (Array.isArray(arg1)) {
    a = arg1;
    comparator = typeof arg2 === 'function' ? arg2 : undefined;
  } else if (typeof arg1 === 'function' && Array.isArray(arg2)) {
    comparator = arg1;
    a = arg2;
  } else {
    throw new Error(
      `sort(array, comparator?) expects an array as first argument, got ${getTypeName(arg1)}.\n` +
      'Example: sort([3, 1, 2]) or sort([3, 1, 2], (a, b) => a - b)'
    );
  }

  const copy = [...a];
  if (comparator) {
    return copy.sort((x, y) => comparator!(x, y));
  }
  return copy.sort((x, y) => {
    if (x < y) return -1;
    if (x > y) return 1;
    return 0;
  });
}

export function flattenArray(arr: any, depth?: number): any[] | undefined {
  if (arr === undefined) return undefined;

  if (Array.isArray(arr)) {
    return arr.flat(depth === undefined ? Infinity : depth);
  }

  if (typeof arr === 'object' && arr !== null) {
    return flattenObject(arr, depth);
  }

  throw new Error(
    `flatten() expects an array or object, got ${getTypeName(arr)}.\n` +
    'Example: flatten([1, [2, [3]]]) or flatten({a: {b: 1}}, "_")'
  );
}

function flattenObject(obj: Record<string, any>, sep: any = '_', prefix = ''): any {
  if (typeof sep === 'number') {
    throw new Error('flatten() with a depth argument is only supported for arrays.');
  }
  const separator = typeof sep === 'string' ? sep : '_';
  const result: Record<string, any> = {};
  for (const key of Object.keys(obj)) {
    const fullKey = prefix ? `${prefix}${separator}${key}` : key;
    if (typeof obj[key] === 'object' && obj[key] !== null && !Array.isArray(obj[key])) {
      Object.assign(result, flattenObject(obj[key], separator, fullKey));
    } else {
      result[fullKey] = obj[key];
    }
  }
  return result;
}
