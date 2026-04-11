/**
 * `expr-eval` core entry — the minimum a caller needs to use `defineParser`
 * and the `Parser`/`Expression` classes. Pulls in nothing from the optional
 * subpath modules (`math`, `string`, `array`, …). Callers compose presets
 * explicitly:
 *
 * ```ts
 * import { defineParser, coreParser } from 'expr-eval/core';
 * import { withMath } from 'expr-eval/math';
 *
 * const parser = defineParser({
 *   operators: [...coreParser.operators, ...withMath.operators],
 *   functions: [...coreParser.functions, ...withMath.functions]
 * });
 * ```
 */
export { Parser } from '../parsing/parser.js';
export { Expression } from '../core/expression.js';
export { defineParser } from '../api/define-parser.js';
export type { ParserConfig } from '../api/define-parser.js';
export { coreParser } from '../api/presets.js';
export type { ParserPreset } from '../api/presets.js';

// Public types
export type {
  Value,
  Values,
  ParserOptions,
  UnaryOperator,
  BinaryOperator,
  SymbolOptions,
  VariableAlias,
  VariableValue,
  VariableResolveResult,
  VariableResolver,
  OperatorFunction
} from '../types/index.js';

export {
  ExpressionError,
  ParseError,
  EvaluationError,
  ArgumentError,
  AccessError,
  VariableError,
  FunctionError
} from '../types/errors.js';

// Descriptor types for advanced users wiring their own presets
export type { OperatorDescriptor, OperatorKind, OperatorAssociativity, PrecedenceLevel } from '../registry/operator-descriptor.js';
export { Precedence } from '../registry/operator-descriptor.js';
export type { FunctionDescriptor, FunctionCategory, FunctionDocs, FunctionParamDoc } from '../registry/function-descriptor.js';

// AST visitor entry point for Expression#accept consumers
export type { Node, Span } from '../ast/nodes.js';
export type { NodeVisitor } from '../ast/visitor.js';
export { BaseVisitor } from '../ast/visitor.js';
