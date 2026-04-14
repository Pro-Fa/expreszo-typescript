/**
 * Built-in function catalog. The single source-of-truth for `Parser.functions`,
 * the `ExpressionValidator` safe allow-list, and the language-service docs.
 * Every `impl` here is the reference the parser registers at construction
 * time. `docs` is merged from `function-docs.ts` at module init so adding a
 * new built-in and its docs are one file + one map entry.
 *
 * `pure: false` is reserved for functions with observable side effects or
 * non-determinism. Only `random` qualifies today.
 *
 * `async: false` everywhere — all current built-ins are synchronous. Users
 * who register async functions via `parser.functions[name] = ...` still
 * work through the runtime scope path; the async-analysis visitor detects
 * them via `constructor.name === 'AsyncFunction'`.
 */
import type { FunctionDescriptor } from '../function-descriptor.js';
import { BUILTIN_FUNCTION_DOCS } from './function-docs.js';
import {
  atan2, condition, fac, filter, fold, gamma, hypot, indexOf, join, map,
  max, min, random, roundTo, sum, json,
  stringLength, isEmpty, stringContains, startsWith, endsWith, searchCount,
  trim, toUpper, toLower, toTitle, split, repeat, reverse, left, right,
  replace, replaceFirst, naturalSort, toNumber, toBoolean,
  padLeft, padRight, padBoth, slice, urlEncode, base64Encode, base64Decode,
  coalesceString, merge, keys, values, count,
  clamp, reduce, find, some, every, unique, distinct, sort, flattenArray, mapValues,
  pick, omit,
  isArray, isObject, isNumber, isString, isBoolean, isNull, isUndefined, isFunctionValue,
  mean, median, mostFrequent, variance, stddev, percentile,
  range, chunk, union, intersect, groupBy, countBy
} from '../../functions/index.js';
import { pow } from '../../operators/binary/index.js';

const RAW_BUILTIN_FUNCTIONS: readonly Omit<FunctionDescriptor, 'docs'>[] = [
  // Math
  { name: 'atan2',   category: 'math', pure: true,  safe: true, async: false, impl: atan2 },
  { name: 'clamp',   category: 'math', pure: true,  safe: true, async: false, impl: clamp },
  { name: 'fac',     category: 'math', pure: true,  safe: true, async: false, impl: fac },
  { name: 'gamma',   category: 'math', pure: true,  safe: true, async: false, impl: gamma },
  { name: 'hypot',   category: 'math', pure: true,  safe: true, async: false, impl: hypot },
  { name: 'max',     category: 'math', pure: true,  safe: true, async: false, impl: max },
  { name: 'min',     category: 'math', pure: true,  safe: true, async: false, impl: min },
  { name: 'pow',     category: 'math', pure: true,  safe: true, async: false, impl: pow },
  { name: 'random',  category: 'math', pure: false, safe: true, async: false, impl: random },
  { name: 'roundTo', category: 'math', pure: true,  safe: true, async: false, impl: roundTo },
  { name: 'sum',     category: 'math', pure: true,  safe: true, async: false, impl: sum },
  { name: 'mean',         category: 'math', pure: true, safe: true, async: false, impl: mean },
  { name: 'median',       category: 'math', pure: true, safe: true, async: false, impl: median },
  { name: 'mostFrequent', category: 'math', pure: true, safe: true, async: false, impl: mostFrequent },
  { name: 'variance',     category: 'math', pure: true, safe: true, async: false, impl: variance },
  { name: 'stddev',       category: 'math', pure: true, safe: true, async: false, impl: stddev },
  { name: 'percentile',   category: 'math', pure: true, safe: true, async: false, impl: percentile },

  // Array
  { name: 'count',    category: 'array', pure: true, safe: true, async: false, impl: count },
  { name: 'filter',   category: 'array', pure: true, safe: true, async: false, impl: filter },
  { name: 'fold',     category: 'array', pure: true, safe: true, async: false, impl: fold },
  { name: 'reduce',   category: 'array', pure: true, safe: true, async: false, impl: reduce },
  { name: 'find',     category: 'array', pure: true, safe: true, async: false, impl: find },
  { name: 'some',     category: 'array', pure: true, safe: true, async: false, impl: some },
  { name: 'every',    category: 'array', pure: true, safe: true, async: false, impl: every },
  { name: 'unique',   category: 'array', pure: true, safe: true, async: false, impl: unique },
  { name: 'distinct', category: 'array', pure: true, safe: true, async: false, impl: distinct },
  { name: 'indexOf',  category: 'array', pure: true, safe: true, async: false, impl: indexOf },
  { name: 'join',     category: 'array', pure: true, safe: true, async: false, impl: join },
  { name: 'map',      category: 'array', pure: true, safe: true, async: false, impl: map },
  { name: 'range',     category: 'array', pure: true, safe: true, async: false, impl: range },
  { name: 'chunk',     category: 'array', pure: true, safe: true, async: false, impl: chunk },
  { name: 'union',     category: 'array', pure: true, safe: true, async: false, impl: union },
  { name: 'intersect', category: 'array', pure: true, safe: true, async: false, impl: intersect },
  { name: 'groupBy',   category: 'array', pure: true, safe: true, async: false, impl: groupBy },
  { name: 'countBy',   category: 'array', pure: true, safe: true, async: false, impl: countBy },

  // String
  { name: 'length',       category: 'string', pure: true, safe: true, async: false, impl: stringLength },
  { name: 'isEmpty',      category: 'string', pure: true, safe: true, async: false, impl: isEmpty },
  { name: 'contains',     category: 'string', pure: true, safe: true, async: false, impl: stringContains },
  { name: 'startsWith',   category: 'string', pure: true, safe: true, async: false, impl: startsWith },
  { name: 'endsWith',     category: 'string', pure: true, safe: true, async: false, impl: endsWith },
  { name: 'searchCount',  category: 'string', pure: true, safe: true, async: false, impl: searchCount },
  { name: 'trim',         category: 'string', pure: true, safe: true, async: false, impl: trim },
  { name: 'toUpper',      category: 'string', pure: true, safe: true, async: false, impl: toUpper },
  { name: 'toLower',      category: 'string', pure: true, safe: true, async: false, impl: toLower },
  { name: 'toTitle',      category: 'string', pure: true, safe: true, async: false, impl: toTitle },
  { name: 'split',        category: 'string', pure: true, safe: true, async: false, impl: split },
  { name: 'repeat',       category: 'string', pure: true, safe: true, async: false, impl: repeat },
  { name: 'reverse',      category: 'string', pure: true, safe: true, async: false, impl: reverse },
  { name: 'left',         category: 'string', pure: true, safe: true, async: false, impl: left },
  { name: 'right',        category: 'string', pure: true, safe: true, async: false, impl: right },
  { name: 'replace',      category: 'string', pure: true, safe: true, async: false, impl: replace },
  { name: 'replaceFirst', category: 'string', pure: true, safe: true, async: false, impl: replaceFirst },
  { name: 'naturalSort',  category: 'string', pure: true, safe: true, async: false, impl: naturalSort },
  { name: 'toNumber',     category: 'string', pure: true, safe: true, async: false, impl: toNumber },
  { name: 'toBoolean',    category: 'string', pure: true, safe: true, async: false, impl: toBoolean },
  { name: 'padLeft',      category: 'string', pure: true, safe: true, async: false, impl: padLeft },
  { name: 'padRight',     category: 'string', pure: true, safe: true, async: false, impl: padRight },
  { name: 'padBoth',      category: 'string', pure: true, safe: true, async: false, impl: padBoth },
  { name: 'slice',        category: 'string', pure: true, safe: true, async: false, impl: slice },
  { name: 'urlEncode',    category: 'string', pure: true, safe: true, async: false, impl: urlEncode },
  { name: 'base64Encode', category: 'string', pure: true, safe: true, async: false, impl: base64Encode },
  { name: 'base64Decode', category: 'string', pure: true, safe: true, async: false, impl: base64Decode },
  { name: 'coalesce',     category: 'string', pure: true, safe: true, async: false, impl: coalesceString },

  // Array (continued)
  { name: 'sort',      category: 'array', pure: true, safe: true, async: false, impl: sort },
  { name: 'flatten',   category: 'array', pure: true, safe: true, async: false, impl: flattenArray },

  // Object
  { name: 'merge',     category: 'object', pure: true, safe: true, async: false, impl: merge },
  { name: 'keys',      category: 'object', pure: true, safe: true, async: false, impl: keys },
  { name: 'values',    category: 'object', pure: true, safe: true, async: false, impl: values },
  { name: 'mapValues', category: 'object', pure: true, safe: true, async: false, impl: mapValues },
  { name: 'pick',      category: 'object', pure: true, safe: true, async: false, impl: pick },
  { name: 'omit',      category: 'object', pure: true, safe: true, async: false, impl: omit },

  // Utility
  { name: 'if',   category: 'utility', pure: true, safe: true, async: false, impl: condition },
  { name: 'json', category: 'utility', pure: true, safe: true, async: false, impl: json },

  // Type-check
  { name: 'isArray',     category: 'type-check', pure: true, safe: true, async: false, impl: isArray },
  { name: 'isObject',    category: 'type-check', pure: true, safe: true, async: false, impl: isObject },
  { name: 'isNumber',    category: 'type-check', pure: true, safe: true, async: false, impl: isNumber },
  { name: 'isString',    category: 'type-check', pure: true, safe: true, async: false, impl: isString },
  { name: 'isBoolean',   category: 'type-check', pure: true, safe: true, async: false, impl: isBoolean },
  { name: 'isNull',      category: 'type-check', pure: true, safe: true, async: false, impl: isNull },
  { name: 'isUndefined', category: 'type-check', pure: true, safe: true, async: false, impl: isUndefined },
  { name: 'isFunction',  category: 'type-check', pure: true, safe: true, async: false, impl: isFunctionValue }
];

export const BUILTIN_FUNCTIONS: readonly FunctionDescriptor[] = RAW_BUILTIN_FUNCTIONS.map(
  (desc): FunctionDescriptor => {
    const docs = BUILTIN_FUNCTION_DOCS[desc.name];
    return docs ? { ...desc, docs } : desc;
  }
);

/**
 * Name → descriptor lookup built once at module load. Language service,
 * validator, and `defineParser` all read through this map.
 */
export const BUILTIN_FUNCTIONS_BY_NAME: ReadonlyMap<string, FunctionDescriptor> = new Map(
  BUILTIN_FUNCTIONS.map((d) => [d.name, d])
);
