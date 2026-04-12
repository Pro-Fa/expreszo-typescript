/**
 * String manipulation functions
 * Provides comprehensive string operations for the expression parser
 */
import { getTypeName } from '../../types/values.js';

/**
 * Returns the length of a string
 */
export function stringLength(str: string | undefined): number | undefined {
  if (str === undefined) {
    return undefined;
  }
  if (typeof str !== 'string') {
    throw new Error(`length() expects a string, got ${getTypeName(str)}`);
  }
  return str.length;
}

/**
 * Checks if a string is empty (null or length === 0)
 */
export function isEmpty(str: string | null | undefined): boolean | undefined {
  if (str === undefined) {
    return undefined;
  }
  if (str === null) {
    return true;
  }
  if (typeof str !== 'string') {
    throw new Error(`isEmpty() expects a string, got ${getTypeName(str)}`);
  }

  return str.length === 0;
}

/**
 * Checks if a string contains a substring
 */
export function stringContains(haystack: any, needle: any): boolean | undefined {
  if (haystack === undefined || needle === undefined) {
    return undefined;
  }
  if (Array.isArray(haystack)) {
    return haystack.includes(needle);
  }
  if (typeof haystack === 'string') {
    return haystack.includes(String(needle));
  }
  throw new Error(`contains() expects a string or array as first argument, got ${getTypeName(haystack)}`);
}

/**
 * Checks if a string starts with a substring
 */
export function startsWith(str: string | undefined, substring: string | undefined): boolean | undefined {
  if (str === undefined || substring === undefined) {
    return undefined;
  }
  if (typeof str !== 'string') {
    throw new Error(`startsWith() expects a string as first argument, got ${getTypeName(str)}`);
  }
  if (typeof substring !== 'string') {
    throw new Error(`startsWith() expects a string as second argument, got ${getTypeName(substring)}`);
  }
  return str.startsWith(substring);
}

/**
 * Checks if a string ends with a substring
 */
export function endsWith(str: string | undefined, substring: string | undefined): boolean | undefined {
  if (str === undefined || substring === undefined) {
    return undefined;
  }
  if (typeof str !== 'string') {
    throw new Error(`endsWith() expects a string as first argument, got ${getTypeName(str)}`);
  }
  if (typeof substring !== 'string') {
    throw new Error(`endsWith() expects a string as second argument, got ${getTypeName(substring)}`);
  }
  return str.endsWith(substring);
}

/**
 * Counts the number of non-overlapping occurrences of a substring in a string
 */
export function searchCount(text: string | undefined, substring: string | undefined): number | undefined {
  if (text === undefined || substring === undefined) {
    return undefined;
  }
  if (typeof text !== 'string') {
    throw new Error(`searchCount() expects a string as first argument, got ${getTypeName(text)}`);
  }
  if (typeof substring !== 'string') {
    throw new Error(`searchCount() expects a string as second argument, got ${getTypeName(substring)}`);
  }
  if (substring.length === 0) {
    return 0;
  }

  let count = 0;
  let position = 0;
  while ((position = text.indexOf(substring, position)) !== -1) {
    count++;
    position += substring.length;
  }
  return count;
}

/**
 * Removes whitespace (or specified characters) from both ends of a string
 */
export function trim(str: string | undefined, chars?: string): string | undefined {
  if (str === undefined) {
    return undefined;
  }
  if (typeof str !== 'string') {
    throw new Error(`trim() expects a string as first argument, got ${getTypeName(str)}`);
  }
  if (chars !== undefined && typeof chars !== 'string') {
    throw new Error(`trim() expects a string as second argument, got ${getTypeName(chars)}`);
  }

  if (chars === undefined) {
    return str.trim();
  }

  // Trim custom characters from both ends
  let start = 0;
  let end = str.length;

  while (start < end && chars.includes(str[start])) {
    start++;
  }

  while (end > start && chars.includes(str[end - 1])) {
    end--;
  }

  return str.slice(start, end);
}

/**
 * Converts a string to uppercase
 */
export function toUpper(str: string | undefined): string | undefined {
  if (str === undefined) {
    return undefined;
  }
  if (typeof str !== 'string') {
    throw new Error(`toUpper() expects a string, got ${getTypeName(str)}`);
  }
  return str.toUpperCase();
}

/**
 * Converts a string to lowercase
 */
export function toLower(str: string | undefined): string | undefined {
  if (str === undefined) {
    return undefined;
  }
  if (typeof str !== 'string') {
    throw new Error(`toLower() expects a string, got ${getTypeName(str)}`);
  }
  return str.toLowerCase();
}

/**
 * Converts a string to title case (first letter of each word capitalized)
 */
export function toTitle(str: string | undefined): string | undefined {
  if (str === undefined) {
    return undefined;
  }
  if (typeof str !== 'string') {
    throw new Error(`toTitle() expects a string, got ${getTypeName(str)}`);
  }
  return str.replace(/\b\w/g, (char) => char.toUpperCase());
}

/**
 * Joins an array of strings with a glue string
 * Note: This extends the existing join function to handle string arrays specifically
 */
export function stringJoin(arr: string[] | undefined, glue: string | undefined): string | undefined {
  if (arr === undefined || glue === undefined) {
    return undefined;
  }
  if (!Array.isArray(arr)) {
    throw new Error(`join() expects an array as first argument, got ${getTypeName(arr)}`);
  }
  if (typeof glue !== 'string') {
    throw new Error(`join() expects a string as second argument, got ${getTypeName(glue)}`);
  }
  return arr.join(glue);
}

/**
 * Splits a string by a delimiter
 */
export function split(str: string | undefined, delimiter: string | undefined): string[] | undefined {
  if (str === undefined || delimiter === undefined) {
    return undefined;
  }
  if (typeof str !== 'string') {
    throw new Error(`split() expects a string as first argument, got ${getTypeName(str)}`);
  }
  if (typeof delimiter !== 'string') {
    throw new Error(`split() expects a string as second argument, got ${getTypeName(delimiter)}`);
  }
  return str.split(delimiter);
}

/**
 * Repeats a string a specified number of times
 */
export function repeat(str: string | undefined, times: number | undefined): string | undefined {
  if (str === undefined || times === undefined) {
    return undefined;
  }
  if (typeof str !== 'string') {
    throw new Error(`repeat() expects a string as first argument, got ${getTypeName(str)}`);
  }
  if (typeof times !== 'number') {
    throw new Error(`repeat() expects a number as second argument, got ${getTypeName(times)}`);
  }
  if (times < 0 || !Number.isInteger(times)) {
    throw new Error(`repeat() expects a non-negative integer as second argument, got ${times}`);
  }
  return str.repeat(times);
}

/**
 * Reverses a string
 */
export function reverse(val: any): any {
  if (val === undefined) {
    return undefined;
  }
  if (Array.isArray(val)) {
    return [...val].reverse();
  }
  if (typeof val === 'string') {
    let result = '';
    for (let i = val.length - 1; i >= 0; i--) {
      result += val[i];
    }
    return result;
  }
  throw new Error(`reverse() expects a string or array, got ${getTypeName(val)}`);
}

/**
 * Returns the leftmost count characters from a string
 */
export function left(str: string | undefined, count: number | undefined): string | undefined {
  if (str === undefined || count === undefined) {
    return undefined;
  }
  if (typeof str !== 'string') {
    throw new Error(`left() expects a string as first argument, got ${getTypeName(str)}`);
  }
  if (typeof count !== 'number') {
    throw new Error(`left() expects a number as second argument, got ${getTypeName(count)}`);
  }
  if (count < 0) {
    throw new Error(`left() expects a non-negative number as second argument, got ${count}`);
  }
  return str.slice(0, count);
}

/**
 * Returns the rightmost count characters from a string
 */
export function right(str: string | undefined, count: number | undefined): string | undefined {
  if (str === undefined || count === undefined) {
    return undefined;
  }
  if (typeof str !== 'string') {
    throw new Error(`right() expects a string as first argument, got ${getTypeName(str)}`);
  }
  if (typeof count !== 'number') {
    throw new Error(`right() expects a number as second argument, got ${getTypeName(count)}`);
  }
  if (count < 0) {
    throw new Error(`right() expects a non-negative number as second argument, got ${count}`);
  }
  if (count === 0) {
    return '';
  }
  return str.slice(-count);
}

/**
 * Replaces all occurrences of oldValue with newValue in a string
 */
export function replace(str: string | undefined, oldValue: string | undefined, newValue: string | undefined): string | undefined {
  if (str === undefined || oldValue === undefined || newValue === undefined) {
    return undefined;
  }
  if (typeof str !== 'string') {
    throw new Error(`replace() expects a string as first argument, got ${getTypeName(str)}`);
  }
  if (typeof oldValue !== 'string') {
    throw new Error(`replace() expects a string as second argument, got ${getTypeName(oldValue)}`);
  }
  if (typeof newValue !== 'string') {
    throw new Error(`replace() expects a string as third argument, got ${getTypeName(newValue)}`);
  }
  // Use split and join for compatibility with older JS targets
  return str.split(oldValue).join(newValue);
}

/**
 * Replaces the first occurrence of oldValue with newValue in a string
 */
export function replaceFirst(str: string | undefined, oldValue: string | undefined, newValue: string | undefined): string | undefined {
  if (str === undefined || oldValue === undefined || newValue === undefined) {
    return undefined;
  }
  if (typeof str !== 'string') {
    throw new Error(`replaceFirst() expects a string as first argument, got ${getTypeName(str)}`);
  }
  if (typeof oldValue !== 'string') {
    throw new Error(`replaceFirst() expects a string as second argument, got ${getTypeName(oldValue)}`);
  }
  if (typeof newValue !== 'string') {
    throw new Error(`replaceFirst() expects a string as third argument, got ${getTypeName(newValue)}`);
  }
  return str.replace(oldValue, newValue);
}

/**
 * Sorts an array of strings using natural sort order (alphanumeric aware)
 */
const naturalSortCollator = new Intl.Collator(undefined, {
  numeric: true,
  sensitivity: 'base'
});

export function naturalSort(arr: string[] | undefined): string[] | undefined {
  if (arr === undefined) {
    return undefined;
  }
  if (!Array.isArray(arr)) {
    throw new Error(`naturalSort() expects an array, got ${getTypeName(arr)}`);
  }

  return [...arr].sort(naturalSortCollator.compare);
}

/**
 * Converts a string to a number
 */
export function toNumber(str: string | undefined): number | undefined {
  if (str === undefined) {
    return undefined;
  }
  if (typeof str !== 'string') {
    throw new Error(`toNumber() expects a string, got ${getTypeName(str)}`);
  }
  const num = Number(str);
  if (isNaN(num)) {
    throw new Error(`toNumber() cannot convert "${str}" to a number. The string must be a valid numeric value.`);
  }
  return num;
}

/**
 * Converts a string to a boolean
 * Recognizes: 'true', '1', 'yes', 'on' as true (case-insensitive)
 * Recognizes: 'false', '0', 'no', 'off', '' as false (case-insensitive)
 */
export function toBoolean(str: string | undefined): boolean | undefined {
  if (str === undefined) {
    return undefined;
  }
  if (typeof str !== 'string') {
    throw new Error(`toBoolean() expects a string, got ${getTypeName(str)}`);
  }

  const lower = str.toLowerCase().trim();

  if (lower === 'true' || lower === '1' || lower === 'yes' || lower === 'on') {
    return true;
  }
  if (lower === 'false' || lower === '0' || lower === 'no' || lower === 'off' || lower === '') {
    return false;
  }

  throw new Error(`toBoolean() cannot convert "${str}" to a boolean. Recognized values: 'true', '1', 'yes', 'on', 'false', '0', 'no', 'off'`);
}

/**
 * Pads a string on the left to reach the target length
 */
export function padLeft(str: string | undefined, targetLength: number | undefined, padString?: string): string | undefined {
  if (str === undefined || targetLength === undefined) {
    return undefined;
  }
  if (typeof str !== 'string') {
    throw new Error(`padLeft() expects a string as first argument, got ${getTypeName(str)}`);
  }
  if (typeof targetLength !== 'number') {
    throw new Error(`padLeft() expects a number as second argument, got ${getTypeName(targetLength)}`);
  }
  if (targetLength < 0 || !Number.isInteger(targetLength)) {
    throw new Error(`padLeft() expects a non-negative integer as second argument, got ${targetLength}`);
  }
  if (padString !== undefined && typeof padString !== 'string') {
    throw new Error(`padLeft() expects a string as third argument, got ${getTypeName(padString)}`);
  }
  return str.padStart(targetLength, padString);
}

/**
 * Pads a string on the right to reach the target length
 */
export function padRight(str: string | undefined, targetLength: number | undefined, padString?: string): string | undefined {
  if (str === undefined || targetLength === undefined) {
    return undefined;
  }
  if (typeof str !== 'string') {
    throw new Error(`padRight() expects a string as first argument, got ${getTypeName(str)}`);
  }
  if (typeof targetLength !== 'number') {
    throw new Error(`padRight() expects a number as second argument, got ${getTypeName(targetLength)}`);
  }
  if (targetLength < 0 || !Number.isInteger(targetLength)) {
    throw new Error(`padRight() expects a non-negative integer as second argument, got ${targetLength}`);
  }
  if (padString !== undefined && typeof padString !== 'string') {
    throw new Error(`padRight() expects a string as third argument, got ${getTypeName(padString)}`);
  }
  return str.padEnd(targetLength, padString);
}

/**
 * Pads a string on both sides to reach the target length
 * If an odd number of padding characters is needed, the extra character is added on the right
 */
export function padBoth(str: string | undefined, targetLength: number | undefined, padString?: string): string | undefined {
  if (str === undefined || targetLength === undefined) {
    return undefined;
  }
  if (typeof str !== 'string') {
    throw new Error(`padBoth() expects a string as first argument, got ${getTypeName(str)}`);
  }
  if (typeof targetLength !== 'number') {
    throw new Error(`padBoth() expects a number as second argument, got ${getTypeName(targetLength)}`);
  }
  if (targetLength < 0 || !Number.isInteger(targetLength)) {
    throw new Error(`padBoth() expects a non-negative integer as second argument, got ${targetLength}`);
  }
  if (padString !== undefined && typeof padString !== 'string') {
    throw new Error(`padBoth() expects a string as third argument, got ${getTypeName(padString)}`);
  }

  const totalPadding = targetLength - str.length;
  if (totalPadding <= 0) {
    return str;
  }

  const leftPadding = Math.floor(totalPadding / 2);
  const rightPadding = totalPadding - leftPadding;

  const actualPadString = padString ?? ' ';
  const leftPad = actualPadString.repeat(Math.ceil(leftPadding / actualPadString.length)).slice(0, leftPadding);
  const rightPad = actualPadString.repeat(Math.ceil(rightPadding / actualPadString.length)).slice(0, rightPadding);

  return leftPad + str + rightPad;
}

/**
 * Extracts a portion of a string or array
 * Supports negative indices (counting from the end)
 * @param s - The string or array to slice
 * @param start - Start index (negative counts from end)
 * @param end - End index (optional, negative counts from end)
 */
export function slice(
  s: string | any[] | undefined,
  start: number | undefined,
  end?: number
): string | any[] | undefined {
  if (s === undefined || start === undefined) {
    return undefined;
  }
  if (typeof s !== 'string' && !Array.isArray(s)) {
    throw new Error(`slice() expects a string or array as first argument, got ${getTypeName(s)}`);
  }
  if (typeof start !== 'number') {
    throw new Error(`slice() expects a number as second argument, got ${getTypeName(start)}`);
  }
  if (end !== undefined && typeof end !== 'number') {
    throw new Error(`slice() expects a number as third argument, got ${getTypeName(end)}`);
  }

  return s.slice(start, end);
}

/**
 * URL-encodes a string
 * Uses encodeURIComponent for safe encoding
 */
export function urlEncode(str: string | undefined): string | undefined {
  if (str === undefined) {
    return undefined;
  }
  if (typeof str !== 'string') {
    throw new Error(`urlEncode() expects a string, got ${getTypeName(str)}`);
  }
  return encodeURIComponent(str);
}

// Global declarations for btoa/atob (available in Node.js 16+ and browsers)
declare function btoa(data: string): string;
declare function atob(data: string): string;

/**
 * Base64-encodes a string
 * Handles UTF-8 encoding properly using btoa
 */
export function base64Encode(str: string | undefined): string | undefined {
  if (str === undefined) {
    return undefined;
  }
  if (typeof str !== 'string') {
    throw new Error(`base64Encode() expects a string, got ${getTypeName(str)}`);
  }
  // Encode UTF-8 string to base64 using btoa
  // First encode as UTF-8 bytes, then convert to binary string for btoa
  const utf8Str = unescape(encodeURIComponent(str));
  return btoa(utf8Str);
}

/**
 * Base64-decodes a string
 * Handles UTF-8 decoding properly using atob
 */
export function base64Decode(str: string | undefined): string | undefined {
  if (str === undefined) {
    return undefined;
  }
  if (typeof str !== 'string') {
    throw new Error(`base64Decode() expects a string, got ${getTypeName(str)}`);
  }
  try {
    // Decode base64 to binary string, then decode UTF-8
    const binaryStr = atob(str);
    return decodeURIComponent(escape(binaryStr));
  } catch {
    throw new Error('base64Decode() received an invalid base64 string. Ensure the input contains only valid base64 characters (A-Z, a-z, 0-9, +, /, =).');
  }
}

/**
 * Returns the first non-null and non-empty string value from the arguments
 * @param args - Any number of values to check
 */
export function coalesceString(...args: any[]): any {
  for (const arg of args) {
    if (arg !== undefined && arg !== null && arg !== '') {
      return arg;
    }
  }
  return args.length > 0 ? args[args.length - 1] : undefined;
}
