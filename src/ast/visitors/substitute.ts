/**
 * Substitute every `Ident` reference to `variable` with a given replacement
 * AST. Mirrors the legacy `src/core/substitute.ts` which inlines the
 * replacement's RPN in place of each matching `IVAR`.
 *
 * `NameRef` is NOT rewritten — it represents a declaration name (assignment
 * target, function parameter, property key) and matches the legacy behaviour
 * of only replacing reads (`IVAR`), not writes (`IVARNAME`).
 */
import {
  type Node,
  mkArray,
  mkObject,
  mkMember,
  mkUnary,
  mkBinary,
  mkTernary,
  mkCall,
  mkLambda,
  mkFunctionDef,
  mkCase,
  mkSequence,
  mkParen
} from '../nodes.js';

function substituteNode(node: Node, variable: string, replacement: Node): Node {
  switch (node.type) {
    case 'NumberLit':
    case 'StringLit':
    case 'BoolLit':
    case 'NullLit':
    case 'UndefinedLit':
    case 'RawLit':
    case 'NameRef':
      return node;
    case 'Ident':
      return node.name === variable ? replacement : node;
    case 'ArrayLit':
      return mkArray(
        node.elements.map((e) =>
          e.type === 'ArraySpread'
            ? { type: 'ArraySpread' as const, argument: substituteNode(e.argument, variable, replacement), span: e.span }
            : substituteNode(e, variable, replacement)
        ),
        node.span
      );
    case 'ObjectLit':
      return mkObject(
        node.properties.map((entry) => {
          if ('type' in entry && (entry as any).type === 'ObjectSpread') {
            const s = entry as import('../nodes.js').ObjectSpread;
            return { type: 'ObjectSpread' as const, argument: substituteNode(s.argument, variable, replacement), span: s.span };
          }
          const p = entry as import('../nodes.js').ObjectProperty;
          return { key: p.key, value: substituteNode(p.value, variable, replacement), quoted: p.quoted };
        }),
        node.span
      );
    case 'Member':
      return mkMember(substituteNode(node.object, variable, replacement), node.property, node.span);
    case 'Unary':
      return mkUnary(node.op, substituteNode(node.operand, variable, replacement), node.span);
    case 'Binary':
      return mkBinary(
        node.op,
        substituteNode(node.left, variable, replacement),
        substituteNode(node.right, variable, replacement),
        node.span
      );
    case 'Ternary':
      return mkTernary(
        node.op,
        substituteNode(node.a, variable, replacement),
        substituteNode(node.b, variable, replacement),
        substituteNode(node.c, variable, replacement),
        node.span
      );
    case 'Call':
      return mkCall(
        substituteNode(node.callee, variable, replacement),
        node.args.map((a) => substituteNode(a, variable, replacement)),
        node.span
      );
    case 'Lambda':
      return mkLambda(node.params, substituteNode(node.body, variable, replacement), node.span);
    case 'FunctionDef':
      return mkFunctionDef(
        node.name,
        node.params,
        substituteNode(node.body, variable, replacement),
        node.span
      );
    case 'Case': {
      const subject = node.subject ? substituteNode(node.subject, variable, replacement) : null;
      const arms = node.arms.map((arm) => ({
        when: substituteNode(arm.when, variable, replacement),
        then: substituteNode(arm.then, variable, replacement)
      }));
      const elseBranch = node.else ? substituteNode(node.else, variable, replacement) : null;
      return mkCase(subject, arms, elseBranch, node.span);
    }
    case 'Sequence':
      return mkSequence(
        node.statements.map((s) => substituteNode(s, variable, replacement)),
        node.span
      );
    case 'Paren':
      return mkParen(substituteNode(node.inner, variable, replacement), node.span);
    default: {
      const exhaustive: never = node;
      throw new Error('substitute: unhandled node kind ' + String((exhaustive as Node).type));
    }
  }
}

export function substituteAst(node: Node, variable: string, replacement: Node): Node {
  return substituteNode(node, variable, replacement);
}
