/**
 * `defineParser` — descriptor-driven factory for building a `Parser` from a
 * preset composition. v7 public API shape: instead of `new Parser()` pulling
 * in every built-in operator and function at construction time, callers
 * compose the descriptor arrays they need and hand them to `defineParser`.
 *
 * This is the API-shape half of the tree-shakeability story. The bundle-size
 * half (per-category subpath entries in `dist/`) lands in Phase 5.
 */
import { Parser } from '../parsing/parser.js';
import type { OperatorDescriptor } from '../registry/operator-descriptor.js';
import type { FunctionDescriptor } from '../registry/function-descriptor.js';
import type { OperatorFunction } from '../types/parser.js';
import type { Value, VariableResolver } from '../types/values.js';

/**
 * Configuration passed to `defineParser`. Operators and functions are the
 * descriptor arrays exported from `src/registry/presets/`. Compose them by
 * spreading — see `src/api/presets.ts` for canonical combinations.
 */
export interface ParserConfig {
  readonly operators: readonly OperatorDescriptor[];
  readonly functions: readonly FunctionDescriptor[];
  readonly constants?: Readonly<Record<string, Value>>;
  readonly literals?: Readonly<Record<string, Value>>;
  readonly resolve?: VariableResolver;
  readonly options?: {
    readonly allowMemberAccess?: boolean;
    readonly operators?: Readonly<Record<string, boolean>>;
  };
}

/**
 * Builds a `Parser` pre-populated with the descriptors in `config`. The
 * returned parser is a standard `Parser` instance — every existing method
 * (`parse`, `evaluate`, `isOperatorEnabled`) works unchanged.
 *
 * Internally this creates a bare parser and then overwrites its
 * `unaryOps` / `binaryOps` / `ternaryOps` / `functions` records from the
 * descriptor arrays. The parser constructor still references the full
 * built-in catalog so the intermediate representation is loaded even when
 * it's overwritten; tree shaking kicks in at the Phase 5 subpath-entry
 * boundary, not here.
 */
export function defineParser(config: ParserConfig): Parser {
  const parser = new Parser({
    allowMemberAccess: config.options?.allowMemberAccess,
    operators: config.options?.operators
  });

  const unaryOps: Record<string, OperatorFunction> = {};
  const binaryOps: Record<string, OperatorFunction> = {};
  const ternaryOps: Record<string, OperatorFunction> = {};

  for (const op of config.operators) {
    if (op.kind === 'prefix' || op.kind === 'postfix') {
      unaryOps[op.symbol] = op.impl;
    } else if (op.kind === 'infix') {
      binaryOps[op.symbol] = op.impl;
    } else if (op.kind === 'ternary') {
      ternaryOps[op.symbol] = op.impl;
    }
  }

  parser.unaryOps = unaryOps;
  parser.binaryOps = binaryOps;
  parser.ternaryOps = ternaryOps;

  const functions: Record<string, OperatorFunction> = {};
  for (const fn of config.functions) {
    functions[fn.name] = fn.impl;
  }
  parser.functions = functions;

  if (config.constants) {
    parser.numericConstants = { ...config.constants };
  }
  if (config.literals) {
    parser.buildInLiterals = { ...config.literals };
  }
  if (config.resolve) {
    parser.resolve = config.resolve;
  }

  return parser;
}
