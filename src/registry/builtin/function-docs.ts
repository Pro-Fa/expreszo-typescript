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
      { name: 'n', description: 'Upper bound (exclusive).', optional: true, type: 'number' }
    ]
  },
  fac: {
    description: 'Factorial of n. Deprecated; prefer the ! operator.',
    params: [
      { name: 'n', description: 'Non-negative integer.', type: 'number' }
    ]
  },
  min: {
    description: 'Smallest number in the list.',
    params: [
      { name: 'values', description: 'Numbers to compare.', isVariadic: true, type: 'number' }
    ]
  },
  max: {
    description: 'Largest number in the list.',
    params: [
      { name: 'values', description: 'Numbers to compare.', isVariadic: true, type: 'number' }
    ]
  },
  hypot: {
    description: 'Hypotenuse √(a² + b²).',
    params: [
      { name: 'a', description: 'First side.', type: 'number' },
      { name: 'b', description: 'Second side.', type: 'number' }
    ]
  },
  pow: {
    description: 'Raise x to the power of y.',
    params: [
      { name: 'x', description: 'Base.', type: 'number' },
      { name: 'y', description: 'Exponent.', type: 'number' }
    ]
  },
  atan2: {
    description: 'Arc tangent of y / x.',
    params: [
      { name: 'y', description: 'Y coordinate.', type: 'number' },
      { name: 'x', description: 'X coordinate.', type: 'number' }
    ]
  },
  roundTo: {
    description: 'Round x to n decimal places.',
    params: [
      { name: 'x', description: 'Number to round.', type: 'number' },
      { name: 'n', description: 'Number of decimal places.', type: 'number' }
    ]
  },
  map: {
    description: 'Apply function f to each element of array a.',
    params: [
      { name: 'a', description: 'Input array.', type: 'array' },
      { name: 'f', description: 'Mapping function (value, index).', type: 'function' }
    ]
  },
  fold: {
    description: 'Reduce array a using function f, starting with accumulator y.',
    params: [
      { name: 'a', description: 'Input array.', type: 'array' },
      { name: 'y', description: 'Initial accumulator value.', type: 'any' },
      { name: 'f', description: 'Reducer function. Eg: `f(acc, x, i) = acc + x`.', type: 'function' }
    ]
  },
  filter: {
    description: 'Filter array a using predicate f.',
    params: [
      { name: 'a', description: 'Input array.', type: 'array' },
      { name: 'f', description: 'Filter function. Eg:`f(x) = x % 2 == 0`', type: 'function' }
    ]
  },
  indexOf: {
    description: 'First index of x in a (array or string), or -1 if not found.',
    params: [
      { name: 'a', description: 'Array or string to search.', type: 'any' },
      { name: 'x', description: 'Value to search for.', type: 'any' }
    ]
  },
  join: {
    description: 'Join array a using separator sep.',
    params: [
      { name: 'a', description: 'Array to join.', type: 'array' },
      { name: 'sep', description: 'Separator string.', type: 'string' }
    ]
  },
  if: {
    description: 'Conditional expression: condition ? trueValue : falseValue (both branches evaluate).',
    params: [
      { name: 'condition', description: 'A boolean condition.', type: 'boolean' },
      { name: 'trueValue', description: 'Value if condition is true.', type: 'any' },
      { name: 'falseValue', description: 'Value if condition is false.', type: 'any' }
    ]
  },
  json: {
    description: 'Return JSON string representation of x.',
    params: [
      { name: 'x', description: 'Value to stringify.', type: 'any' }
    ]
  },
  sum: {
    description: 'Sum of all elements in an array.',
    params: [
      { name: 'a', description: 'Array of numbers.', type: 'array' }
    ]
  },
  count: {
    description: 'Returns the number of items in an array.',
    params: [
      { name: 'a', description: 'Array to count.', type: 'array' }
    ]
  },
  reduce: {
    description: 'Alias for fold. Reduce array a using function f, starting with accumulator y.',
    params: [
      { name: 'a', description: 'Input array.', type: 'array' },
      { name: 'y', description: 'Initial accumulator value.', type: 'any' },
      { name: 'f', description: 'Reducer function. Eg: `f(acc, x, i) = acc + x`.', type: 'function' }
    ]
  },
  find: {
    description: 'Returns the first element in array a that satisfies predicate f, or undefined if not found.',
    params: [
      { name: 'a', description: 'Input array.', type: 'array' },
      { name: 'f', description: 'Predicate function. Eg: `f(x) = x > 5`', type: 'function' }
    ]
  },
  some: {
    description: 'Returns true if at least one element in array a satisfies predicate f.',
    params: [
      { name: 'a', description: 'Input array.', type: 'array' },
      { name: 'f', description: 'Predicate function. Eg: `f(x) = x > 5`', type: 'function' }
    ]
  },
  every: {
    description: 'Returns true if all elements in array a satisfy predicate f. Returns true for empty arrays.',
    params: [
      { name: 'a', description: 'Input array.', type: 'array' },
      { name: 'f', description: 'Predicate function. Eg: `f(x) = x > 0`', type: 'function' }
    ]
  },
  unique: {
    description: 'Returns a new array with duplicate values removed from array a.',
    params: [
      { name: 'a', description: 'Input array.', type: 'array' }
    ]
  },
  distinct: {
    description: 'Alias for unique. Returns a new array with duplicate values removed from array a.',
    params: [
      { name: 'a', description: 'Input array.', type: 'array' }
    ]
  },
  clamp: {
    description: 'Clamps a value between a minimum and maximum.',
    params: [
      { name: 'value', description: 'The value to clamp.', type: 'number' },
      { name: 'min', description: 'Minimum allowed value.', type: 'number' },
      { name: 'max', description: 'Maximum allowed value.', type: 'number' }
    ]
  },
  length: {
    description: 'Return the length of a string.',
    params: [{ name: 'str', description: 'Input string.', type: 'string' }]
  },
  isEmpty: {
    description: 'Return true if the string is empty.',
    params: [{ name: 'str', description: 'Input string.', type: 'string' }]
  },
  contains: {
    description: 'Return true if str contains substring.',
    params: [
      { name: 'str', description: 'Input string.', type: 'string' },
      { name: 'substring', description: 'Substring to search for.', type: 'string' }
    ]
  },
  startsWith: {
    description: 'Return true if str starts with substring.',
    params: [
      { name: 'str', description: 'Input string.', type: 'string' },
      { name: 'substring', description: 'Prefix to check.', type: 'string' }
    ]
  },
  endsWith: {
    description: 'Return true if str ends with substring.',
    params: [
      { name: 'str', description: 'Input string.', type: 'string' },
      { name: 'substring', description: 'Suffix to check.', type: 'string' }
    ]
  },
  split: {
    description: 'Split string by delimiter into an array.',
    params: [
      { name: 'str', description: 'Input string.', type: 'string' },
      { name: 'delimiter', description: 'Delimiter string.', type: 'string' }
    ]
  },
  trim: {
    description: 'Remove whitespace (or specified characters) from both ends of a string.',
    params: [
      { name: 'str', description: 'Input string.', type: 'string' },
      { name: 'chars', description: 'Characters to trim.', optional: true, type: 'string' }
    ]
  },
  padLeft: {
    description: 'Pad string on the left to reach target length.',
    params: [
      { name: 'str', description: 'Input string.', type: 'string' },
      { name: 'length', description: 'Target length.', type: 'number' },
      { name: 'padStr', description: 'Padding string.', optional: true, type: 'string' }
    ]
  },
  padRight: {
    description: 'Pad string on the right to reach target length.',
    params: [
      { name: 'str', description: 'Input string.', type: 'string' },
      { name: 'length', description: 'Target length.', type: 'number' },
      { name: 'padStr', description: 'Padding string.', optional: true, type: 'string' }
    ]
  },
  padBoth: {
    description: 'Pad string on both sides to reach target length. Extra padding goes on the right.',
    params: [
      { name: 'str', description: 'Input string.', type: 'string' },
      { name: 'length', description: 'Target length.', type: 'number' },
      { name: 'padStr', description: 'Padding string.', optional: true, type: 'string' }
    ]
  },
  slice: {
    description: 'Extract a portion of a string or array. Supports negative indices.',
    params: [
      { name: 's', description: 'Input string or array.', type: 'any' },
      { name: 'start', description: 'Start index (negative counts from end).', type: 'number' },
      { name: 'end', description: 'End index (negative counts from end).', optional: true, type: 'number' }
    ]
  },
  urlEncode: {
    description: 'URL-encode a string using encodeURIComponent.',
    params: [
      { name: 'str', description: 'String to encode.', type: 'string' }
    ]
  },
  base64Encode: {
    description: 'Base64-encode a string with UTF-8 support.',
    params: [
      { name: 'str', description: 'String to encode.', type: 'string' }
    ]
  },
  base64Decode: {
    description: 'Base64-decode a string with UTF-8 support.',
    params: [
      { name: 'str', description: 'Base64 string to decode.', type: 'string' }
    ]
  },
  coalesce: {
    description: 'Return the first non-null and non-empty string value from the arguments.',
    params: [
      { name: 'values', description: 'Values to check.', isVariadic: true, type: 'any' }
    ]
  },
  merge: {
    description: 'Merge two or more objects together. Duplicate keys are overwritten by later arguments.',
    params: [
      { name: 'objects', description: 'Objects to merge.', isVariadic: true, type: 'object' }
    ]
  },
  keys: {
    description: 'Return an array of strings containing the keys of the object.',
    params: [
      { name: 'obj', description: 'Input object.', type: 'object' }
    ]
  },
  values: {
    description: 'Return an array containing the values of the object.',
    params: [
      { name: 'obj', description: 'Input object.', type: 'object' }
    ]
  },
  flatten: {
    description: 'Flatten a nested object\'s keys using an optional separator (default: _). For example, {foo: {bar: 1}} becomes {foo_bar: 1}.',
    params: [
      { name: 'obj', description: 'Input object.', type: 'object' },
      { name: 'separator', description: 'Key separator (default: _).', optional: true, type: 'string' }
    ]
  },
  isArray: {
    description: 'Returns true if the value is an array.',
    params: [
      { name: 'value', description: 'Value to check.', type: 'any' }
    ]
  },
  isObject: {
    description: 'Returns true if the value is an object (excluding null and arrays).',
    params: [
      { name: 'value', description: 'Value to check.', type: 'any' }
    ]
  },
  isNumber: {
    description: 'Returns true if the value is a number.',
    params: [
      { name: 'value', description: 'Value to check.', type: 'any' }
    ]
  },
  isString: {
    description: 'Returns true if the value is a string.',
    params: [
      { name: 'value', description: 'Value to check.', type: 'any' }
    ]
  },
  isBoolean: {
    description: 'Returns true if the value is a boolean.',
    params: [
      { name: 'value', description: 'Value to check.', type: 'any' }
    ]
  },
  isNull: {
    description: 'Returns true if the value is null.',
    params: [
      { name: 'value', description: 'Value to check.', type: 'any' }
    ]
  },
  isUndefined: {
    description: 'Returns true if the value is undefined.',
    params: [
      { name: 'value', description: 'Value to check.', type: 'any' }
    ]
  },
  isFunction: {
    description: 'Returns true if the value is a function.',
    params: [
      { name: 'value', description: 'Value to check.', type: 'any' }
    ]
  },
  mean: {
    description: 'Arithmetic mean (average) of an array of numbers. Returns undefined for an empty array.',
    params: [
      { name: 'a', description: 'Array of numbers.', type: 'array' }
    ]
  },
  median: {
    description: 'Median of an array of numbers. For an even-length array, returns the mean of the two middle values. Returns undefined for an empty array.',
    params: [
      { name: 'a', description: 'Array of numbers.', type: 'array' }
    ]
  },
  mostFrequent: {
    description: 'Most frequently occurring value in an array (statistical mode). On ties, returns the value that first reached the highest count. Works on any element type.',
    params: [
      { name: 'a', description: 'Input array.', type: 'array' }
    ]
  },
  variance: {
    description: 'Population variance (mean of squared deviations from the mean). Returns undefined for an empty array.',
    params: [
      { name: 'a', description: 'Array of numbers.', type: 'array' }
    ]
  },
  stddev: {
    description: 'Population standard deviation (square root of variance). Returns undefined for an empty array.',
    params: [
      { name: 'a', description: 'Array of numbers.', type: 'array' }
    ]
  },
  percentile: {
    description: 'Value at the given percentile using linear interpolation between ranks. p is a percentage in [0, 100].',
    params: [
      { name: 'a', description: 'Array of numbers.', type: 'array' },
      { name: 'p', description: 'Percentile in [0, 100].', type: 'number' }
    ]
  },
  range: {
    description: 'Generate an array of numbers from start (inclusive) to end (exclusive). Step defaults to 1; a negative step counts down.',
    params: [
      { name: 'start', description: 'Start value (inclusive).', type: 'number' },
      { name: 'end', description: 'End value (exclusive).', type: 'number' },
      { name: 'step', description: 'Step size (default 1).', optional: true, type: 'number' }
    ]
  },
  chunk: {
    description: 'Split array into groups of `size` elements. The last chunk may be shorter.',
    params: [
      { name: 'a', description: 'Input array.', type: 'array' },
      { name: 'size', description: 'Positive integer chunk size.', type: 'number' }
    ]
  },
  union: {
    description: 'Concatenate arrays and remove duplicates, preserving first-seen order. Element equality follows Set semantics (strict for primitives, reference for objects).',
    params: [
      { name: 'arrays', description: 'Arrays to union.', isVariadic: true, type: 'array' }
    ]
  },
  intersect: {
    description: 'Elements present in every input array, deduped and preserving the order they appear in the first array. Element equality follows Set semantics.',
    params: [
      { name: 'arrays', description: 'Arrays to intersect.', isVariadic: true, type: 'array' }
    ]
  },
  groupBy: {
    description: 'Group elements into an object keyed by `keyFn(element, index)`. Each value is an array of elements in original order. Keys are coerced to strings.',
    params: [
      { name: 'a', description: 'Input array.', type: 'array' },
      { name: 'keyFn', description: 'Key function. Eg: `u => u.role`', type: 'function' }
    ]
  },
  countBy: {
    description: 'Count elements by key using `keyFn(element, index)`. Returns an object mapping each key to its element count. Keys are coerced to strings.',
    params: [
      { name: 'a', description: 'Input array.', type: 'array' },
      { name: 'keyFn', description: 'Key function. Eg: `u => u.role`', type: 'function' }
    ]
  },
  pick: {
    description: 'Return a new object containing only the listed keys. Missing keys are silently skipped.',
    params: [
      { name: 'obj', description: 'Source object.', type: 'object' },
      { name: 'keys', description: 'Array of string keys to keep.', type: 'array' }
    ]
  },
  omit: {
    description: 'Return a new object with the listed keys removed. Missing keys are silently ignored.',
    params: [
      { name: 'obj', description: 'Source object.', type: 'object' },
      { name: 'keys', description: 'Array of string keys to drop.', type: 'array' }
    ]
  }
};
