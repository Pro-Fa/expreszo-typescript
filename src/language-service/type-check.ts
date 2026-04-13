import type { TextDocument } from 'vscode-languageserver-textdocument';
import type { Diagnostic } from 'vscode-languageserver-types';
import { DiagnosticSeverity } from 'vscode-languageserver-types';
import type { Call, Node } from '../ast/nodes.js';
import type { ParseCache } from './shared/parse-cache.js';
import type { ParamType, FunctionParamDoc } from '../registry/function-descriptor.js';
import { BUILTIN_FUNCTIONS_BY_NAME } from '../registry/builtin/functions.js';
import { walk } from '../ast/visitor.js';
import { getRootNode } from './shared/positioned-symbols.js';
import { spanToRange } from './shared/positions.js';

function literalType(arg: Node): ParamType | null {
  switch (arg.type) {
    case 'NumberLit':
      return 'number';
    case 'StringLit':
      return 'string';
    case 'BoolLit':
      return 'boolean';
    case 'NullLit':
    case 'UndefinedLit':
      return 'any';
    case 'ArrayLit':
      return 'array';
    case 'ObjectLit':
      return 'object';
    case 'Lambda':
    case 'FunctionDef':
      return 'function';
    default:
      return null;
  }
}

function isCompatible(actual: ParamType, expected: ParamType | undefined): boolean {
  if (!expected || expected === 'any' || actual === 'any') return true;
  return actual === expected;
}

function paramTypeFor(
  params: readonly FunctionParamDoc[],
  argIndex: number
): ParamType | undefined {
  if (params.length === 0) return undefined;
  const last = params[params.length - 1];
  if (argIndex < params.length) return params[argIndex].type;
  if (last.isVariadic) return last.type;
  return undefined;
}

function calleeName(callee: Node): string | null {
  if (callee.type === 'Ident' || callee.type === 'NameRef') return callee.name;
  return null;
}

/**
 * Walks the parsed AST looking for `Call` nodes with literal arguments whose
 * concrete type does not match the declared parameter type. Emits a
 * `type-mismatch` warning per offending literal. Non-literal arguments (idents,
 * member chains, nested calls, operators) are not checked — those would
 * require inference/resolution beyond the scope of this pass.
 */
export function getTypeMismatchDiagnostics(
  doc: TextDocument,
  parseCache: ParseCache
): Diagnostic[] {
  const { expression } = parseCache.get(doc);
  if (!expression) return [];

  const out: Diagnostic[] = [];
  const root = getRootNode(expression);

  walk(root, (node) => {
    if (node.type !== 'Call') return;
    const call = node as Call;
    const name = calleeName(call.callee);
    if (!name) return;

    const descriptor = BUILTIN_FUNCTIONS_BY_NAME.get(name);
    const params = descriptor?.docs?.params;
    if (!params || params.length === 0) return;

    for (let i = 0; i < call.args.length; i++) {
      const arg = call.args[i];
      const actual = literalType(arg);
      if (actual === null || actual === 'any') continue;
      const expected = paramTypeFor(params, i);
      if (isCompatible(actual, expected)) continue;

      out.push({
        range: spanToRange(doc, arg.span),
        severity: DiagnosticSeverity.Warning,
        message: `Argument ${i + 1} of '${name}' expects ${expected}, got ${actual}.`,
        source: 'expreszo',
        code: 'type-mismatch'
      });
    }
  });

  return out;
}
