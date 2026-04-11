/**
 * Built-in function documentation. Keyed by function name, merged into
 * `BUILTIN_FUNCTIONS` descriptors at module-init time so the registry is
 * the single source the language service reads. Adding docs for a new
 * built-in means adding an entry here.
 */
import type { FunctionDocs } from '../function-descriptor.js';

export const BUILTIN_FUNCTION_DOCS: Readonly<Record<string, FunctionDocs>> = {
  random: {
    description: 'Get a random number in the range [0, n). Defaults to 1 if n is missing or zero.',
    params: [
      { name: 'n', description: 'Upper bound (exclusive).', optional: true }
    ]
  },
  fac: {
    description: 'Factorial of n. Deprecated; prefer the ! operator.',
    params: [
      { name: 'n', description: 'Non-negative integer.' }
    ]
  },
  min: {
    description: 'Smallest number in the list.',
    params: [
      { name: 'values', description: 'Numbers to compare.', isVariadic: true }
    ]
  },
  max: {
    description: 'Largest number in the list.',
    params: [
      { name: 'values', description: 'Numbers to compare.', isVariadic: true }
    ]
  },
  hypot: {
    description: 'Hypotenuse √(a² + b²).',
    params: [
      { name: 'a', description: 'First side.' },
      { name: 'b', description: 'Second side.' }
    ]
  },
  pow: {
    description: 'Raise x to the power of y.',
    params: [
      { name: 'x', description: 'Base.' },
      { name: 'y', description: 'Exponent.' }
    ]
  },
  atan2: {
    description: 'Arc tangent of y / x.',
    params: [
      { name: 'y', description: 'Y coordinate.' },
      { name: 'x', description: 'X coordinate.' }
    ]
  },
  roundTo: {
    description: 'Round x to n decimal places.',
    params: [
      { name: 'x', description: 'Number to round.' },
      { name: 'n', description: 'Number of decimal places.' }
    ]
  },
  map: {
    description: 'Apply function f to each element of array a.',
    params: [
      { name: 'a', description: 'Input array.' },
      { name: 'f', description: 'Mapping function (value, index).' }
    ]
  },
  fold: {
    description: 'Reduce array a using function f, starting with accumulator y.',
    params: [
      { name: 'a', description: 'Input array.' },
      { name: 'y', description: 'Initial accumulator value.' },
      { name: 'f', description: 'Reducer function. Eg: `f(acc, x, i) = acc + x`.' }
    ]
  },
  filter: {
    description: 'Filter array a using predicate f.',
    params: [
      { name: 'a', description: 'Input array.' },
      { name: 'f', description: 'Filter function. Eg:`f(x) = x % 2 == 0`' }
    ]
  },
  indexOf: {
    description: 'First index of x in a (array or string), or -1 if not found.',
    params: [
      { name: 'x', description: 'Value to search for.' },
      { name: 'a', description: 'Array or string to search.' }
    ]
  },
  join: {
    description: 'Join array a using separator sep.',
    params: [
      { name: 'sep', description: 'Separator string.' },
      { name: 'a', description: 'Array to join.' }
    ]
  },
  if: {
    description: 'Conditional expression: condition ? trueValue : falseValue (both branches evaluate).',
    params: [
      { name: 'condition', description: 'A boolean condition.' },
      { name: 'trueValue', description: 'Value if condition is true.' },
      { name: 'falseValue', description: 'Value if condition is false.' }
    ]
  },
  json: {
    description: 'Return JSON string representation of x.',
    params: [
      { name: 'x', description: 'Value to stringify.' }
    ]
  },
  sum: {
    description: 'Sum of all elements in an array.',
    params: [
      { name: 'a', description: 'Array of numbers.' }
    ]
  },
  count: {
    description: 'Returns the number of items in an array.',
    params: [
      { name: 'a', description: 'Array to count.' }
    ]
  },
  reduce: {
    description: 'Alias for fold. Reduce array a using function f, starting with accumulator y.',
    params: [
      { name: 'a', description: 'Input array.' },
      { name: 'y', description: 'Initial accumulator value.' },
      { name: 'f', description: 'Reducer function. Eg: `f(acc, x, i) = acc + x`.' }
    ]
  },
  find: {
    description: 'Returns the first element in array a that satisfies predicate f, or undefined if not found.',
    params: [
      { name: 'a', description: 'Input array.' },
      { name: 'f', description: 'Predicate function. Eg: `f(x) = x > 5`' }
    ]
  },
  some: {
    description: 'Returns true if at least one element in array a satisfies predicate f.',
    params: [
      { name: 'a', description: 'Input array.' },
      { name: 'f', description: 'Predicate function. Eg: `f(x) = x > 5`' }
    ]
  },
  every: {
    description: 'Returns true if all elements in array a satisfy predicate f. Returns true for empty arrays.',
    params: [
      { name: 'a', description: 'Input array.' },
      { name: 'f', description: 'Predicate function. Eg: `f(x) = x > 0`' }
    ]
  },
  unique: {
    description: 'Returns a new array with duplicate values removed from array a.',
    params: [
      { name: 'a', description: 'Input array.' }
    ]
  },
  distinct: {
    description: 'Alias for unique. Returns a new array with duplicate values removed from array a.',
    params: [
      { name: 'a', description: 'Input array.' }
    ]
  },
  clamp: {
    description: 'Clamps a value between a minimum and maximum.',
    params: [
      { name: 'value', description: 'The value to clamp.' },
      { name: 'min', description: 'Minimum allowed value.' },
      { name: 'max', description: 'Maximum allowed value.' }
    ]
  },
  length: {
    description: 'Return the length of a string.',
    params: [{ name: 'str', description: 'Input string.' }]
  },
  isEmpty: {
    description: 'Return true if the string is empty.',
    params: [{ name: 'str', description: 'Input string.' }]
  },
  contains: {
    description: 'Return true if str contains substring.',
    params: [
      { name: 'str', description: 'Input string.' },
      { name: 'substring', description: 'Substring to search for.' }
    ]
  },
  startsWith: {
    description: 'Return true if str starts with substring.',
    params: [
      { name: 'str', description: 'Input string.' },
      { name: 'substring', description: 'Prefix to check.' }
    ]
  },
  endsWith: {
    description: 'Return true if str ends with substring.',
    params: [
      { name: 'str', description: 'Input string.' },
      { name: 'substring', description: 'Suffix to check.' }
    ]
  },
  split: {
    description: 'Split string by delimiter into an array.',
    params: [
      { name: 'str', description: 'Input string.' },
      { name: 'delimiter', description: 'Delimiter string.' }
    ]
  },
  trim: {
    description: 'Remove whitespace (or specified characters) from both ends of a string.',
    params: [
      { name: 'str', description: 'Input string.' },
      { name: 'chars', description: 'Characters to trim.', optional: true }
    ]
  },
  padLeft: {
    description: 'Pad string on the left to reach target length.',
    params: [
      { name: 'str', description: 'Input string.' },
      { name: 'length', description: 'Target length.' },
      { name: 'padStr', description: 'Padding string.', optional: true }
    ]
  },
  padRight: {
    description: 'Pad string on the right to reach target length.',
    params: [
      { name: 'str', description: 'Input string.' },
      { name: 'length', description: 'Target length.' },
      { name: 'padStr', description: 'Padding string.', optional: true }
    ]
  },
  padBoth: {
    description: 'Pad string on both sides to reach target length. Extra padding goes on the right.',
    params: [
      { name: 'str', description: 'Input string.' },
      { name: 'length', description: 'Target length.' },
      { name: 'padStr', description: 'Padding string.', optional: true }
    ]
  },
  slice: {
    description: 'Extract a portion of a string or array. Supports negative indices.',
    params: [
      { name: 's', description: 'Input string or array.' },
      { name: 'start', description: 'Start index (negative counts from end).' },
      { name: 'end', description: 'End index (negative counts from end).', optional: true }
    ]
  },
  urlEncode: {
    description: 'URL-encode a string using encodeURIComponent.',
    params: [
      { name: 'str', description: 'String to encode.' }
    ]
  },
  base64Encode: {
    description: 'Base64-encode a string with UTF-8 support.',
    params: [
      { name: 'str', description: 'String to encode.' }
    ]
  },
  base64Decode: {
    description: 'Base64-decode a string with UTF-8 support.',
    params: [
      { name: 'str', description: 'Base64 string to decode.' }
    ]
  },
  coalesce: {
    description: 'Return the first non-null and non-empty string value from the arguments.',
    params: [
      { name: 'values', description: 'Values to check.', isVariadic: true }
    ]
  },
  merge: {
    description: 'Merge two or more objects together. Duplicate keys are overwritten by later arguments.',
    params: [
      { name: 'objects', description: 'Objects to merge.', isVariadic: true }
    ]
  },
  keys: {
    description: 'Return an array of strings containing the keys of the object.',
    params: [
      { name: 'obj', description: 'Input object.' }
    ]
  },
  values: {
    description: 'Return an array containing the values of the object.',
    params: [
      { name: 'obj', description: 'Input object.' }
    ]
  },
  flatten: {
    description: 'Flatten a nested object\'s keys using an optional separator (default: _). For example, {foo: {bar: 1}} becomes {foo_bar: 1}.',
    params: [
      { name: 'obj', description: 'Input object.' },
      { name: 'separator', description: 'Key separator (default: _).', optional: true }
    ]
  },
  isArray: {
    description: 'Returns true if the value is an array.',
    params: [
      { name: 'value', description: 'Value to check.' }
    ]
  },
  isObject: {
    description: 'Returns true if the value is an object (excluding null and arrays).',
    params: [
      { name: 'value', description: 'Value to check.' }
    ]
  },
  isNumber: {
    description: 'Returns true if the value is a number.',
    params: [
      { name: 'value', description: 'Value to check.' }
    ]
  },
  isString: {
    description: 'Returns true if the value is a string.',
    params: [
      { name: 'value', description: 'Value to check.' }
    ]
  },
  isBoolean: {
    description: 'Returns true if the value is a boolean.',
    params: [
      { name: 'value', description: 'Value to check.' }
    ]
  },
  isNull: {
    description: 'Returns true if the value is null.',
    params: [
      { name: 'value', description: 'Value to check.' }
    ]
  },
  isUndefined: {
    description: 'Returns true if the value is undefined.',
    params: [
      { name: 'value', description: 'Value to check.' }
    ]
  },
  isFunction: {
    description: 'Returns true if the value is a function.',
    params: [
      { name: 'value', description: 'Value to check.' }
    ]
  }
};
