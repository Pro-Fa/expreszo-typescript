/**
 * String and object manipulation utility functions
 */

import { Value, getTypeName } from '../../types/values.js';
import { DANGEROUS_PROPERTIES } from '../../validation/constants.js';

/**
 * Converts a value to JSON string representation
 * @param content - The value to stringify
 * @returns JSON string representation
 */
export function json(content: Value): string | undefined {
  if (content === undefined) {
    return undefined;
  }
  return JSON.stringify(content);
}

export function toJson(content: Value): string | undefined {
  // toJson is an alias for json
  return json(content);
}

const MAX_JSON_DEPTH = 256;

function exceedsMaxDepth(text: string): boolean {
  let depth = 0;
  let inString = false;
  for (let i = 0; i < text.length; i++) {
    const c = text.charCodeAt(i);
    if (inString) {
      if (c === 0x5c) i++;
      else if (c === 0x22) inString = false;
    } else if (c === 0x22) {
      inString = true;
    } else if (c === 0x5b || c === 0x7b) {
      if (++depth > MAX_JSON_DEPTH) return true;
    } else if (c === 0x5d || c === 0x7d) {
      depth--;
    }
  }
  return false;
}

function dropDangerousKeys(key: string, value: unknown): unknown {
  return DANGEROUS_PROPERTIES.has(key) ? undefined : value;
}

/**
 * Parses a JSON string into a value. Keys that expressions may not access
 * (`__proto__`, `prototype`, `constructor`) are dropped and nesting is
 * limited to guard downstream recursive functions.
 *
 * When `fallback` is supplied it is returned for undefined or unparseable
 * input instead of throwing. Error messages never echo the input.
 * @param text - The JSON string to parse
 * @param fallback - Optional value to return when parsing fails
 * @returns The parsed value
 */
export function fromJson(text: string | undefined, ...fallback: Value[]): Value {
  const hasFallback = fallback.length > 0;
  if (text === undefined) {
    return hasFallback ? fallback[0] : undefined;
  }
  if (typeof text !== 'string') {
    throw new Error(`fromJson() expects a string as first argument, got ${getTypeName(text)}`);
  }
  if (exceedsMaxDepth(text)) {
    if (hasFallback) return fallback[0];
    throw new Error(`fromJson(): JSON exceeds the maximum nesting depth of ${MAX_JSON_DEPTH}`);
  }
  try {
    return JSON.parse(text, dropDangerousKeys) as Value;
  } catch (err) {
    if (hasFallback) return fallback[0];
    const position = err instanceof Error ? /position (\d+)/.exec(err.message)?.[1] : undefined;
    throw new Error(
      position === undefined ? 'fromJson(): invalid JSON' : `fromJson(): invalid JSON at position ${position}`
    );
  }
}
