// cSpell:words TEOF fndef
import { PrattParser } from './pratt.js';
import { Expression } from '../core/expression.js';
import type { Value, VariableResolveResult, VariableResolver, Values } from '../types/values.js';
import type { OperatorFunction } from '../types/parser.js';
import { atan2, condition, fac, filter, fold, gamma, hypot, indexOf, indexOfLegacy, join, joinLegacy, map, max, min, random, roundTo, sum, json, stringLength, isEmpty, stringContains, startsWith, endsWith, searchCount, trim, toUpper, toLower, toTitle, split, repeat, reverse, left, right, replace, replaceFirst, naturalSort, toNumber, toBoolean, padLeft, padRight, padBoth, slice, urlEncode, base64Encode, base64Decode, coalesceString, merge, keys, values, count, clamp, reduce, find, some, every, unique, distinct, sort, flattenArray, mapValues, isArray, isObject, isNumber, isString, isBoolean, isNull, isUndefined, isFunctionValue } from '../functions/index.js';
import {
  add,
  addLegacy,
  sub,
  mul,
  div,
  divLegacy,
  mod,
  pow,
  concat,
  concatLegacy,
  equal,
  notEqual,
  greaterThan,
  lessThan,
  greaterThanEqual,
  lessThanEqual,
  greaterThanLegacy,
  lessThanLegacy,
  greaterThanEqualLegacy,
  lessThanEqualLegacy,
  setVar,
  arrayIndexOrProperty,
  andOperator,
  orOperator,
  inOperator,
  notInOperator,
  coalesce,
  asOperator
} from '../operators/binary/index.js';
import {
  pos,
  abs,
  acos,
  sinh,
  tanh,
  asin,
  asinh,
  acosh,
  atan,
  atanh,
  cbrt,
  ceil,
  cos,
  cosh,
  exp,
  floor,
  log,
  log10,
  neg,
  not,
  round,
  sin,
  sqrt,
  tan,
  trunc,
  length,
  sign,
  expm1,
  log1p,
  log2
} from '../operators/unary/index.js';

/**
 * Parser options configuration
 */
interface ParserOptions {
  allowMemberAccess?: boolean;
  operators?: Record<string, boolean>;
  legacy?: boolean;
}

export class Parser {
  public options: ParserOptions;
  public legacy: boolean;
  public keywords: string[];
  public unaryOps: Record<string, OperatorFunction>;
  public binaryOps: Record<string, OperatorFunction>;
  public ternaryOps: Record<string, OperatorFunction>;
  public functions: Record<string, OperatorFunction>;
  public numericConstants: Record<string, Value>;
  public buildInLiterals: Record<string, Value>;
  public resolve: VariableResolver;

  /**
   * Creates a new Parser instance with the specified options.
   *
   * @param options - Configuration options for the parser
   * @example
   * ```typescript
   * const parser = new Parser({
   *   allowMemberAccess: false,
   *   operators: { add: true, multiply: true }
   * });
   * ```
   */
  constructor(options?: ParserOptions) {
    this.options = options || { operators: { conversion: false } };
    this.legacy = this.options.legacy ?? false;
    this.keywords = [
      'case',
      'when',
      'then',
      'else',
      'end'
    ] as const;
    this.unaryOps = {
      '-': neg,
      '+': pos,
      '!': fac,
      abs: abs,
      acos: acos,
      acosh: acosh,
      asin: asin,
      asinh: asinh,
      atan: atan,
      atanh: atanh,
      // 11
      cbrt: cbrt,
      ceil: ceil,
      cos: cos,
      cosh: cosh,
      exp: exp,
      expm1: expm1,
      floor: floor,
      length: length,
      lg: log10,
      ln: log,
      // 21
      log: log,
      log1p: log1p,
      log2: log2,
      log10: log10,
      not: not,
      round: round,
      sign: sign,
      sin: sin,
      sinh: sinh,
      sqrt: sqrt,
      // 31
      tan: tan,
      tanh: tanh,
      trunc: trunc
    };

    this.binaryOps = {
      '+': this.legacy ? addLegacy : add,
      '-': sub,
      '*': mul,
      '/': this.legacy ? divLegacy : div,
      '%': mod,
      '^': pow,
      '|': this.legacy ? concatLegacy : concat,
      '==': equal,
      '!=': notEqual,
      '>': this.legacy ? greaterThanLegacy : greaterThan,
      '<': this.legacy ? lessThanLegacy : lessThan,
      '>=': this.legacy ? greaterThanEqualLegacy : greaterThanEqual,
      '<=': this.legacy ? lessThanEqualLegacy : lessThanEqual,
      '=': setVar,
      '[': arrayIndexOrProperty,
      and: andOperator,
      '&&': andOperator,
      in: inOperator,
      'not in': notInOperator,
      or: orOperator,
      '||': orOperator,
      '??': coalesce,
      'as': asOperator
    };

    this.ternaryOps = {
      '?': condition
    };

    this.functions = {
      atan2: atan2,
      clamp: clamp,
      count: count,
      fac: fac,
      filter: filter,
      fold: fold,
      reduce: reduce,
      find: find,
      some: some,
      every: every,
      unique: unique,
      distinct: distinct,
      gamma: gamma,
      hypot: hypot,
      indexOf: this.legacy ? indexOfLegacy : indexOf,
      if: condition,
      join: this.legacy ? joinLegacy : join,
      map: map,
      max: max,
      min: min,
      pow: pow,
      json: json,
      random: random,
      roundTo: roundTo,
      sum: sum,
      sort: sort,
      // String manipulation functions
      length: stringLength,
      isEmpty: isEmpty,
      contains: stringContains,
      startsWith: startsWith,
      endsWith: endsWith,
      searchCount: searchCount,
      trim: trim,
      toUpper: toUpper,
      toLower: toLower,
      toTitle: toTitle,
      split: split,
      repeat: repeat,
      reverse: reverse,
      left: left,
      right: right,
      replace: replace,
      replaceFirst: replaceFirst,
      naturalSort: naturalSort,
      toNumber: toNumber,
      toBoolean: toBoolean,
      padLeft: padLeft,
      padRight: padRight,
      padBoth: padBoth,
      slice: slice,
      urlEncode: urlEncode,
      base64Encode: base64Encode,
      base64Decode: base64Decode,
      coalesce: coalesceString,
      // Object manipulation functions
      merge: merge,
      keys: keys,
      values: values,
      flatten: flattenArray,
      mapValues: mapValues,
      // Type checking functions
      isArray: isArray,
      isObject: isObject,
      isNumber: isNumber,
      isString: isString,
      isBoolean: isBoolean,
      isNull: isNull,
      isUndefined: isUndefined,
      isFunction: isFunctionValue
    };

    this.numericConstants = {
      E: Math.E,
      PI: Math.PI,
      Infinity: Infinity,
      NaN: NaN
    };

    this.buildInLiterals = {
      true: true,
      false: false,
      null: null
    };

    // A callback that evaluate will call if it doesn't recognize a variable.  The default
    // implementation returns undefined to indicate that it won't resolve the variable.  This
    // gives the code using the Parser a chance to resolve unrecognized variables to add support for
    // things like $myVar, $$myVar, %myVar%, etc.  For example when an expression is evaluated a variables
    // object could be passed in and $myVar could resolve to a property of that object.
    // The return value can be any of:
    // - { alias: "xxx" } the token is an alias for xxx, i.e. use xxx as the token.
    // - { value: <something> } use <something> as the value for the variable
    // - any other value is treated as the value to use for the token.
    this.resolve = (): VariableResolveResult => undefined;
  }

  /**
   * Parses a mathematical expression into an Expression object.
   *
   * @param expr - The mathematical expression string to parse
   * @returns An Expression object that can be evaluated
   * @throws {ParseError} When the expression contains syntax errors
   * @example
   * ```typescript
   * const parser = new Parser();
   * const expression = parser.parse('2 + 3 * x');
   * const result = expression.evaluate({ x: 4 }); // Returns 14
   * ```
   */
  parse(expr: string): Expression {
    const root = PrattParser.parse(this, expr);
    return new Expression(root, this);
  }

  /**
   * Parses and immediately evaluates a mathematical expression.
   * This is a convenience method equivalent to `parser.parse(expr).evaluate(variables, resolver)`.
   *
   * @param expr - The mathematical expression string to evaluate
   * @param variables - Optional object containing variable values
   * @param resolver - Optional per-call variable resolver. Tried before the parser-level
   *   resolver (if any) when a variable is not present in `variables`.
   * @returns The result of evaluating the expression
   * @throws {ParseError} When the expression contains syntax errors
   * @throws {VariableError} When the expression references undefined variables
   * @throws {EvaluationError} When runtime evaluation fails
   * @example
   * ```typescript
   * const parser = new Parser();
   * const result = parser.evaluate('2 + 3 * x', { x: 4 }); // Returns 14
   * ```
   */
  evaluate(expr: string, variables?: Values, resolver?: VariableResolver): Value | Promise<Value> {
    return this.parse(expr).evaluate(variables, resolver);
  }

  private static readonly optionNameMap: Record<string, string> = {
    '+': 'add',
    '-': 'subtract',
    '*': 'multiply',
    '/': 'divide',
    '%': 'remainder',
    '^': 'power',
    '!': 'factorial',
    '<': 'comparison',
    '>': 'comparison',
    '<=': 'comparison',
    '>=': 'comparison',
    '==': 'comparison',
    '!=': 'comparison',
    '|': 'concatenate',
    'and': 'logical',
    'or': 'logical',
    'not': 'logical',
    '&&': 'logical',
    '||': 'logical',
    '?': 'conditional',
    ':': 'conditional',
    '=': 'assignment',
    '[': 'array',
    '()=': 'fndef',
    '=>': 'fndef',
    '??': 'coalesce',
    'as': 'conversion'
  } as const;

  private static getOptionName(op: string): string {
    return Parser.optionNameMap.hasOwnProperty(op) ? Parser.optionNameMap[op] : op;
  }

  /**
   * Checks if a specific operator is enabled in this parser's configuration.
   *
   * @param op - The operator to check
   * @returns True if the operator is enabled, false otherwise
   * @example
   * ```typescript
   * const parser = new Parser({ operators: { add: false } });
   * console.log(parser.isOperatorEnabled('+')); // false
   * console.log(parser.isOperatorEnabled('*')); // true (default enabled)
   * ```
   */
  isOperatorEnabled(op: string): boolean {
    const optionName = Parser.getOptionName(op);
    const operators = this.options.operators || {};

    return !(optionName in operators) || !!operators[optionName];
  }
}
