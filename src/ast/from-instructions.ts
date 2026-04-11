/**
 * Temporary bridge from the legacy RPN `Instruction[]` representation to the
 * v7 `Node` AST. Lives only for Phase 1 — once the Pratt parser in Phase 2
 * emits AST directly, this file is deleted.
 *
 * The bridge simulates the evaluator's stack machine, but instead of computing
 * values it builds AST nodes. The resulting tree is semantically equivalent to
 * the instruction stream and round-trips through the AST-based
 * simplify/substitute/get-symbols/to-string visitors to match the legacy
 * behaviour on the existing test corpus.
 */
import {
  ISCALAR,
  IOP1,
  IOP2,
  IOP3,
  IVAR,
  IVARNAME,
  IFUNCALL,
  IFUNDEF,
  IARROW,
  IEXPR,
  IEXPREVAL,
  IMEMBER,
  IENDSTATEMENT,
  IARRAY,
  IUNDEFINED,
  ICASECOND,
  ICASEMATCH,
  IWHENCOND,
  IWHENMATCH,
  ICASEELSE,
  IPROPERTY,
  IOBJECT,
  IOBJECTEND
} from '../parsing/instruction.js';
import type { Instruction } from '../parsing/instruction.js';
import {
  type Node,
  type CaseArm,
  type ObjectProperty,
  mkNumber,
  mkString,
  mkBool,
  mkNull,
  mkUndefined,
  mkRaw,
  mkArray,
  mkObject,
  mkIdent,
  mkNameRef,
  mkMember,
  mkUnary,
  mkBinary,
  mkTernary,
  mkCall,
  mkLambda,
  mkFunctionDef,
  mkCase,
  mkSequence,
  mkParen,
  NO_SPAN
} from './nodes.js';

/**
 * Sentinel pushed by `ICASEELSE` to tag the following `else` value. Walked off
 * by the surrounding `ICASEMATCH`/`ICASECOND` handler. Never leaks into the
 * finished AST.
 */
const ELSE_MARKER: Node = { type: 'RawLit', value: Symbol('__case_else__'), span: NO_SPAN };

function isElseMarker(node: Node): boolean {
  return node.type === 'RawLit' && typeof node.value === 'symbol';
}

/** Build a literal node from an ISCALAR `value`, narrowing on its JS type. */
function scalarToNode(value: unknown): Node {
  if (typeof value === 'number') return mkNumber(value);
  if (typeof value === 'string') return mkString(value);
  if (typeof value === 'boolean') return mkBool(value);
  if (value === null) return mkNull();
  if (value === undefined) return mkUndefined();
  if (Array.isArray(value)) {
    return mkArray(value.map(scalarToNode));
  }
  return mkRaw(value);
}

/** Extract a declared name from a NameRef/Ident node (parser output for IVARNAME). */
function nodeName(node: Node): string {
  if (node.type === 'NameRef' || node.type === 'Ident') return node.name;
  if (node.type === 'StringLit') return node.value;
  throw new Error('bridge: expected a name-like node, got ' + node.type);
}

/**
 * Convert a flat RPN `Instruction[]` into an equivalent `Node` AST. The root
 * is the value the expression would evaluate to — a `Sequence` when the
 * instruction stream contains `IENDSTATEMENT` separators.
 */
export function fromInstructions(tokens: readonly Instruction[]): Node {
  const nstack: Node[] = [];
  const statements: Node[] = [];
  const flushStatement = (): void => {
    if (nstack.length === 0) return;
    while (nstack.length > 0) {
      statements.push(nstack.shift()!);
    }
  };

  for (let i = 0; i < tokens.length; i++) {
    const item = tokens[i];
    const { type } = item;

    if (type === ISCALAR) {
      nstack.push(scalarToNode(item.value));
    } else if (type === IVAR) {
      nstack.push(mkIdent(String(item.value)));
    } else if (type === IVARNAME) {
      nstack.push(mkNameRef(String(item.value)));
    } else if (type === IUNDEFINED) {
      nstack.push(mkUndefined());
    } else if (type === IOP1) {
      const operand = nstack.pop()!;
      nstack.push(mkUnary(String(item.value), operand));
    } else if (type === IOP2) {
      const right = nstack.pop()!;
      const left = nstack.pop()!;
      nstack.push(mkBinary(String(item.value), left, right));
    } else if (type === IOP3) {
      const c = nstack.pop()!;
      const b = nstack.pop()!;
      const a = nstack.pop()!;
      nstack.push(mkTernary(String(item.value), a, b, c));
    } else if (type === IFUNCALL) {
      let argCount = item.value as number;
      const args: Node[] = [];
      while (argCount-- > 0) {
        args.unshift(nstack.pop()!);
      }
      const callee = nstack.pop()!;
      nstack.push(mkCall(callee, args));
    } else if (type === IFUNDEF) {
      const body = nstack.pop()!;
      const params: string[] = [];
      let paramCount = item.value as number;
      while (paramCount-- > 0) {
        params.unshift(nodeName(nstack.pop()!));
      }
      const name = nodeName(nstack.pop()!);
      nstack.push(mkFunctionDef(name, params, body));
    } else if (type === IARROW) {
      const body = nstack.pop()!;
      const params: string[] = [];
      let paramCount = item.value as number;
      while (paramCount-- > 0) {
        params.unshift(nodeName(nstack.pop()!));
      }
      nstack.push(mkLambda(params, body));
    } else if (type === IEXPR) {
      // Preserve the IEXPR boundary as a Paren node so `to-string` can
      // round-trip the legacy paren-wrapping behaviour byte-for-byte. Other
      // visitors treat Paren as a transparent passthrough.
      nstack.push(mkParen(fromInstructions(item.value as Instruction[])));
    } else if (type === IEXPREVAL) {
      throw new Error('bridge: unexpected IEXPREVAL in source instruction stream');
    } else if (type === IMEMBER) {
      const object = nstack.pop()!;
      nstack.push(mkMember(object, String(item.value)));
    } else if (type === IENDSTATEMENT) {
      // The legacy evaluator pops the top of the stack here (statement
      // result is discarded). In the AST we keep the node as a statement
      // in the surrounding Sequence and move on.
      const stmt = nstack.pop();
      if (stmt !== undefined) statements.push(stmt);
    } else if (type === IARRAY) {
      let count = item.value as number;
      const elements: Node[] = [];
      while (count-- > 0) {
        elements.unshift(nstack.pop()!);
      }
      nstack.push(mkArray(elements));
    } else if (type === ICASEMATCH || type === ICASECOND) {
      const pairCount = (item.value as number) * 2;
      const pairs = nstack.splice(-pairCount, pairCount);
      let elseNode: Node | null = null;
      const arms: CaseArm[] = [];
      for (let j = 0; j < pairs.length; j += 2) {
        const cond = pairs[j];
        const value = pairs[j + 1];
        if (isElseMarker(cond)) {
          elseNode = value;
        } else {
          arms.push({ when: cond, then: value });
        }
      }
      let subject: Node | null = null;
      if (type === ICASEMATCH) {
        subject = nstack.pop() ?? null;
      }
      nstack.push(mkCase(subject, arms, elseNode));
    } else if (type === IWHENCOND || type === IWHENMATCH) {
      // WHEN leaves the (condition, value) pair on the stack already. The
      // legacy evaluator re-resolves IEXPREVAL wrappers here; with AST
      // nodes there is nothing to unwrap, so this is a no-op.
    } else if (type === ICASEELSE) {
      // Legacy semantics: pop 1 (the else value), push (true, value). We
      // tag the pair with an internal marker so the case builder above
      // can distinguish it from a genuine `when true`.
      const elseValue = nstack.pop()!;
      nstack.push(ELSE_MARKER);
      nstack.push(elseValue);
    } else if (type === IOBJECT) {
      nstack.push(mkObject([]));
    } else if (type === IOBJECTEND) {
      // no-op — the ObjectLit on the stack is already complete
    } else if (type === IPROPERTY) {
      const value = nstack.pop()!;
      const obj = nstack.pop()!;
      if (obj.type !== 'ObjectLit') {
        throw new Error('bridge: IPROPERTY without matching ObjectLit, got ' + obj.type);
      }
      const nextProps: ObjectProperty[] = [...obj.properties, { key: String(item.value), value }];
      nstack.push(mkObject(nextProps, obj.span));
    } else {
      throw new Error('bridge: unhandled instruction type ' + String(type));
    }
  }

  if (statements.length === 0) {
    if (nstack.length === 0) {
      // Empty expression — represent as an UndefinedLit. This mirrors the
      // legacy behaviour where `evaluate([])` produces `undefined`.
      return mkUndefined();
    }
    if (nstack.length === 1) return nstack[0];
    // Multiple roots without IENDSTATEMENT — preserve them as a sequence
    // so the visitors have a single root to walk.
    return mkSequence(nstack.slice());
  }

  flushStatement();
  if (statements.length === 1) return statements[0];
  return mkSequence(statements);
}
