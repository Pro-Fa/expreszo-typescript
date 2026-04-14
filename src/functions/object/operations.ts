/**
 * Object manipulation functions
 * Provides comprehensive object operations for the expression parser
 */

import { Value, ValueObject, getTypeName } from '../../types/values.js';

/**
 * Merges two or more objects together.
 * Duplicate keys will be overwritten by later arguments.
 * @param objects - Objects to merge
 * @returns Merged object or undefined if any argument is undefined
 */
export function merge(...objects: (ValueObject | undefined)[]): ValueObject | undefined {
  if (objects.length === 0) {
    return {};
  }

  for (const obj of objects) {
    if (obj === undefined) {
      return undefined;
    }
    if (typeof obj !== 'object' || obj === null || Array.isArray(obj)) {
      throw new Error(`merge() expects objects as arguments, got ${getTypeName(obj)}`);
    }
  }

  return Object.assign({}, ...objects);
}

/**
 * Returns an array of the keys of an object.
 * @param obj - The object to get keys from
 * @returns Array of string keys or undefined if input is undefined
 */
export function keys(obj: ValueObject | undefined): string[] | undefined {
  if (obj === undefined) {
    return undefined;
  }
  if (typeof obj !== 'object' || obj === null || Array.isArray(obj)) {
    throw new Error(`keys() expects an object, got ${getTypeName(obj)}`);
  }
  return Object.keys(obj);
}

/**
 * Returns an array of the values of an object.
 * @param obj - The object to get values from
 * @returns Array of values or undefined if input is undefined
 */
export function values(obj: ValueObject | undefined): Value[] | undefined {
  if (obj === undefined) {
    return undefined;
  }
  if (typeof obj !== 'object' || obj === null || Array.isArray(obj)) {
    throw new Error(`values() expects an object, got ${getTypeName(obj)}`);
  }
  return Object.values(obj);
}

/**
 * Flattens a nested object's keys using underscore as separator.
 * For example: { foo: { bar: 1 } } becomes { foo_bar: 1 }
 * @param obj - The object to flatten
 * @param separator - The separator to use (default: '_')
 * @returns Flattened object or undefined if input is undefined
 */
export function flatten(
  obj: ValueObject | undefined,
  separator: string = '_'
): ValueObject | undefined {
  if (obj === undefined) {
    return undefined;
  }
  if (typeof obj !== 'object' || obj === null || Array.isArray(obj)) {
    throw new Error(`flatten() expects an object as first argument, got ${getTypeName(obj)}`);
  }
  if (typeof separator !== 'string') {
    throw new Error(`flatten() expects a string separator as second argument, got ${getTypeName(separator)}`);
  }

  const result: ValueObject = {};

  function flattenHelper(current: Value, prefix: string): void {
    if (
      current !== null &&
      typeof current === 'object' &&
      !Array.isArray(current)
    ) {
      for (const key of Object.keys(current as ValueObject)) {
        const newKey = prefix ? `${prefix}${separator}${key}` : key;
        flattenHelper((current as ValueObject)[key], newKey);
      }
    } else {
      result[prefix] = current;
    }
  }

  flattenHelper(obj, '');

  return result;
}

/**
 * Returns a new object containing only the given keys from `obj`.
 * Keys that do not exist on `obj` are silently skipped.
 * @param obj - Source object
 * @param keyList - Array of string keys to keep
 */
export function pick(
  obj: ValueObject | undefined,
  keyList: Value[] | string | undefined
): ValueObject | undefined {
  if (obj === undefined || keyList === undefined) {
    return undefined;
  }
  if (typeof obj !== 'object' || obj === null || Array.isArray(obj)) {
    throw new Error(
      `pick(obj, keys) expects an object as first argument, got ${getTypeName(obj)}.\n` +
      'Example: pick({a: 1, b: 2, c: 3}, ["a", "c"])'
    );
  }
  // Accept a single string key as a convenience for single-key picks.
  const list: Value[] = typeof keyList === 'string' ? [keyList] : keyList;
  if (!Array.isArray(list)) {
    throw new Error(
      `pick(obj, keys) expects an array of strings as second argument, got ${getTypeName(keyList)}.\n` +
      'Example: pick({a: 1, b: 2}, ["a"])'
    );
  }
  const result: ValueObject = {};
  for (const k of list) {
    if (typeof k !== 'string') {
      throw new Error(
        `pick(obj, keys) expects all keys to be strings, got ${getTypeName(k)}.\n` +
        'Example: pick({a: 1, b: 2}, ["a", "b"])'
      );
    }
    if (Object.prototype.hasOwnProperty.call(obj, k)) {
      result[k] = obj[k];
    }
  }
  return result;
}

/**
 * Returns a new object with the given keys removed from `obj`.
 * Keys that do not exist on `obj` are silently ignored.
 * @param obj - Source object
 * @param keyList - Array of string keys to drop
 */
export function omit(
  obj: ValueObject | undefined,
  keyList: Value[] | string | undefined
): ValueObject | undefined {
  if (obj === undefined || keyList === undefined) {
    return undefined;
  }
  if (typeof obj !== 'object' || obj === null || Array.isArray(obj)) {
    throw new Error(
      `omit(obj, keys) expects an object as first argument, got ${getTypeName(obj)}.\n` +
      'Example: omit({a: 1, b: 2, c: 3}, ["b"])'
    );
  }
  const list: Value[] = typeof keyList === 'string' ? [keyList] : keyList;
  if (!Array.isArray(list)) {
    throw new Error(
      `omit(obj, keys) expects an array of strings as second argument, got ${getTypeName(keyList)}.\n` +
      'Example: omit({a: 1, b: 2}, ["a"])'
    );
  }
  const exclude = new Set<string>();
  for (const k of list) {
    if (typeof k !== 'string') {
      throw new Error(
        `omit(obj, keys) expects all keys to be strings, got ${getTypeName(k)}.\n` +
        'Example: omit({a: 1, b: 2}, ["a", "b"])'
      );
    }
    exclude.add(k);
  }
  const result: ValueObject = {};
  for (const k of Object.keys(obj)) {
    if (!exclude.has(k)) {
      result[k] = obj[k];
    }
  }
  return result;
}

export function mapValues(obj: any, fn: any): ValueObject | undefined {
  if (obj === undefined) return undefined;
  if (typeof obj !== 'object' || obj === null || Array.isArray(obj)) {
    throw new Error(`mapValues() expects an object as first argument, got ${getTypeName(obj)}`);
  }
  if (typeof fn !== 'function') {
    throw new Error(`mapValues() expects a function as second argument, got ${getTypeName(fn)}. Example: mapValues(obj, (value, key) => value * 2)`);
  }
  const result: ValueObject = {};
  for (const [key, value] of Object.entries(obj)) {
    result[key] = fn(value, key);
  }
  return result;
}
