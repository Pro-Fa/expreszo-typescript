import { describe, it, expect } from 'vitest';
import { simplifyAst, type SimplifyOps } from '../../../src/ast/visitors/simplify.js';
import {
  mkNumber,
  mkString,
  mkBool,
  mkNull,
  mkUndefined,
  mkRaw,
  mkIdent,
  mkNameRef,
  mkMember,
  mkArray,
  mkObject,
  mkArraySpread,
  mkObjectSpread,
  mkUnary,
  mkBinary,
  mkTernary,
  mkCall,
  mkLambda,
  mkFunctionDef,
  mkCase,
  mkSequence,
  mkParen,
} from '../../../src/ast/nodes.js';

function makeOps(values: Record<string, unknown> = {}): SimplifyOps {
  return {
    unaryOps: {
      '-': (a: any) => -a,
      'not': (a: any) => !a,
    },
    binaryOps: {
      '+': (a: any, b: any) => a + b,
      '*': (a: any, b: any) => a * b,
    },
    ternaryOps: {
      'between': (a: any, b: any, c: any) => a >= b && a <= c,
    },
    values,
  };
}

describe('simplifyAst', () => {
  // ---------------------------------------------------------------
  // 1. Literals pass through unchanged
  // ---------------------------------------------------------------
  describe('literals pass through unchanged', () => {
    const ops = makeOps();

    it('NumberLit', () => {
      const node = mkNumber(42);
      expect(simplifyAst(node, ops)).toEqual(node);
    });

    it('StringLit', () => {
      const node = mkString('hello');
      expect(simplifyAst(node, ops)).toEqual(node);
    });

    it('BoolLit', () => {
      const node = mkBool(true);
      expect(simplifyAst(node, ops)).toEqual(node);
    });

    it('NullLit', () => {
      const node = mkNull();
      expect(simplifyAst(node, ops)).toEqual(node);
    });

    it('UndefinedLit', () => {
      const node = mkUndefined();
      expect(simplifyAst(node, ops)).toEqual(node);
    });

    it('RawLit', () => {
      const node = mkRaw([1, 2, 3]);
      expect(simplifyAst(node, ops)).toEqual(node);
    });

    it('NameRef', () => {
      const node = mkNameRef('x');
      expect(simplifyAst(node, ops)).toEqual(node);
    });
  });

  // ---------------------------------------------------------------
  // 2. Ident with known value folds to literal
  // ---------------------------------------------------------------
  describe('Ident with known value folds to literal', () => {
    it('number', () => {
      const ops = makeOps({ x: 10 });
      const result = simplifyAst(mkIdent('x'), ops);
      expect(result).toEqual(mkNumber(10));
    });

    it('string', () => {
      const ops = makeOps({ x: 'hello' });
      const result = simplifyAst(mkIdent('x'), ops);
      expect(result).toEqual(mkString('hello'));
    });

    it('boolean', () => {
      const ops = makeOps({ x: true });
      const result = simplifyAst(mkIdent('x'), ops);
      expect(result).toEqual(mkBool(true));
    });

    it('null', () => {
      const ops = makeOps({ x: null });
      const result = simplifyAst(mkIdent('x'), ops);
      expect(result).toEqual(mkNull());
    });

    it('undefined', () => {
      const ops = makeOps({ x: undefined });
      const result = simplifyAst(mkIdent('x'), ops);
      expect(result).toEqual(mkUndefined());
    });

    it('array wraps as RawLit', () => {
      const arr = [1, 2, 3];
      const ops = makeOps({ x: arr });
      const result = simplifyAst(mkIdent('x'), ops);
      expect(result).toEqual(mkRaw(arr));
    });

    it('object wraps as RawLit', () => {
      const obj = { a: 1 };
      const ops = makeOps({ x: obj });
      const result = simplifyAst(mkIdent('x'), ops);
      expect(result).toEqual(mkRaw(obj));
    });
  });

  // ---------------------------------------------------------------
  // 3. Ident with unknown value returns unchanged
  // ---------------------------------------------------------------
  describe('Ident with unknown value', () => {
    it('returns the Ident node unchanged', () => {
      const ops = makeOps();
      const node = mkIdent('unknown');
      expect(simplifyAst(node, ops)).toEqual(node);
    });
  });

  // ---------------------------------------------------------------
  // 4. Unary folding
  // ---------------------------------------------------------------
  describe('Unary folding', () => {
    it('folds when operand is constant and op exists', () => {
      const ops = makeOps();
      const result = simplifyAst(mkUnary('-', mkNumber(5)), ops);
      expect(result).toEqual(mkNumber(-5));
    });

    it('folds "not" on boolean', () => {
      const ops = makeOps();
      const result = simplifyAst(mkUnary('not', mkBool(true)), ops);
      expect(result).toEqual(mkBool(false));
    });

    it('preserves structure when op does not exist', () => {
      const ops = makeOps();
      const result = simplifyAst(mkUnary('~', mkNumber(5)), ops);
      expect(result.type).toBe('Unary');
      expect((result as any).op).toBe('~');
      expect((result as any).operand).toEqual(mkNumber(5));
    });

    it('preserves structure when operand is not constant', () => {
      const ops = makeOps();
      const result = simplifyAst(mkUnary('-', mkIdent('x')), ops);
      expect(result.type).toBe('Unary');
      expect((result as any).op).toBe('-');
      expect((result as any).operand).toEqual(mkIdent('x'));
    });
  });

  // ---------------------------------------------------------------
  // 5. Binary folding
  // ---------------------------------------------------------------
  describe('Binary folding', () => {
    it('folds when both sides constant and op exists', () => {
      const ops = makeOps();
      const result = simplifyAst(mkBinary('+', mkNumber(3), mkNumber(4)), ops);
      expect(result).toEqual(mkNumber(7));
    });

    it('folds multiplication', () => {
      const ops = makeOps();
      const result = simplifyAst(mkBinary('*', mkNumber(3), mkNumber(4)), ops);
      expect(result).toEqual(mkNumber(12));
    });

    it('preserves structure when op is missing', () => {
      const ops = makeOps();
      const result = simplifyAst(mkBinary('-', mkNumber(3), mkNumber(4)), ops);
      expect(result.type).toBe('Binary');
      expect((result as any).op).toBe('-');
    });

    it('preserves structure when operands are not constant', () => {
      const ops = makeOps();
      const result = simplifyAst(mkBinary('+', mkIdent('x'), mkNumber(4)), ops);
      expect(result.type).toBe('Binary');
      expect((result as any).left).toEqual(mkIdent('x'));
      expect((result as any).right).toEqual(mkNumber(4));
    });
  });

  // ---------------------------------------------------------------
  // 6. Ternary '?' folding
  // ---------------------------------------------------------------
  describe('Ternary ? folding', () => {
    it('truthy condition returns b', () => {
      const ops = makeOps();
      const result = simplifyAst(
        mkTernary('?', mkBool(true), mkNumber(1), mkNumber(2)),
        ops
      );
      expect(result).toEqual(mkNumber(1));
    });

    it('falsy condition returns c', () => {
      const ops = makeOps();
      const result = simplifyAst(
        mkTernary('?', mkBool(false), mkNumber(1), mkNumber(2)),
        ops
      );
      expect(result).toEqual(mkNumber(2));
    });

    it('truthy number condition returns b', () => {
      const ops = makeOps();
      const result = simplifyAst(
        mkTernary('?', mkNumber(1), mkString('yes'), mkString('no')),
        ops
      );
      expect(result).toEqual(mkString('yes'));
    });

    it('null condition (falsy) returns c', () => {
      const ops = makeOps();
      const result = simplifyAst(
        mkTernary('?', mkNull(), mkString('yes'), mkString('no')),
        ops
      );
      expect(result).toEqual(mkString('no'));
    });
  });

  // ---------------------------------------------------------------
  // 7. Ternary non-'?' op
  // ---------------------------------------------------------------
  describe('Ternary non-? op', () => {
    it('folds when all constant and op in ternaryOps', () => {
      const ops = makeOps();
      const result = simplifyAst(
        mkTernary('between', mkNumber(5), mkNumber(1), mkNumber(10)),
        ops
      );
      expect(result).toEqual(mkBool(true));
    });

    it('folds to false when condition not met', () => {
      const ops = makeOps();
      const result = simplifyAst(
        mkTernary('between', mkNumber(15), mkNumber(1), mkNumber(10)),
        ops
      );
      expect(result).toEqual(mkBool(false));
    });

    it('preserves structure when op not in ternaryOps', () => {
      const ops = makeOps();
      const result = simplifyAst(
        mkTernary('clamp', mkNumber(5), mkNumber(1), mkNumber(10)),
        ops
      );
      expect(result.type).toBe('Ternary');
      expect((result as any).op).toBe('clamp');
    });
  });

  // ---------------------------------------------------------------
  // 8. Ternary partial constant
  // ---------------------------------------------------------------
  describe('Ternary partial constant', () => {
    it('preserves structure when not all operands are constant', () => {
      const ops = makeOps();
      const result = simplifyAst(
        mkTernary('?', mkIdent('x'), mkNumber(1), mkNumber(2)),
        ops
      );
      expect(result.type).toBe('Ternary');
      expect((result as any).op).toBe('?');
      expect((result as any).a).toEqual(mkIdent('x'));
      expect((result as any).b).toEqual(mkNumber(1));
      expect((result as any).c).toEqual(mkNumber(2));
    });

    it('preserves non-? ternary when not all constant', () => {
      const ops = makeOps();
      const result = simplifyAst(
        mkTernary('between', mkIdent('x'), mkNumber(1), mkNumber(10)),
        ops
      );
      expect(result.type).toBe('Ternary');
      expect((result as any).op).toBe('between');
    });
  });

  // ---------------------------------------------------------------
  // 9. Member on constant object
  // ---------------------------------------------------------------
  describe('Member on constant object', () => {
    it('folds member access on known object', () => {
      const ops = makeOps({ obj: { x: 42 } });
      const result = simplifyAst(mkMember(mkIdent('obj'), 'x'), ops);
      expect(result).toEqual(mkNumber(42));
    });

    it('folds member access to string value', () => {
      const ops = makeOps({ obj: { name: 'hello' } });
      const result = simplifyAst(mkMember(mkIdent('obj'), 'name'), ops);
      expect(result).toEqual(mkString('hello'));
    });

    it('folds member access to undefined when property missing', () => {
      const ops = makeOps({ obj: { x: 42 } });
      const result = simplifyAst(mkMember(mkIdent('obj'), 'y'), ops);
      expect(result).toEqual(mkUndefined());
    });
  });

  // ---------------------------------------------------------------
  // 10. Member on null/undefined returns member node unchanged
  // ---------------------------------------------------------------
  describe('Member on null/undefined', () => {
    it('returns member node when object is null', () => {
      const ops = makeOps({ obj: null });
      const result = simplifyAst(mkMember(mkIdent('obj'), 'x'), ops);
      expect(result.type).toBe('Member');
      expect((result as any).property).toBe('x');
    });

    it('returns member node when object is undefined', () => {
      const ops = makeOps({ obj: undefined });
      const result = simplifyAst(mkMember(mkIdent('obj'), 'x'), ops);
      expect(result.type).toBe('Member');
      expect((result as any).property).toBe('x');
    });
  });

  // ---------------------------------------------------------------
  // 11. Member on non-constant
  // ---------------------------------------------------------------
  describe('Member on non-constant', () => {
    it('returns member node with simplified object', () => {
      const ops = makeOps();
      const result = simplifyAst(mkMember(mkIdent('x'), 'prop'), ops);
      expect(result.type).toBe('Member');
      expect((result as any).object).toEqual(mkIdent('x'));
      expect((result as any).property).toBe('prop');
    });

    it('simplifies the object subtree', () => {
      const ops = makeOps({ a: 5 });
      // mkMember(mkBinary('+', mkIdent('a'), mkNumber(1)), 'length')
      // 'a' folds to 5, then 5 + 1 folds to 6, then member on 6 (number)
      // 6 is not null/undefined so it folds: (6 as Record)['length'] = undefined
      const result = simplifyAst(
        mkMember(mkBinary('+', mkIdent('a'), mkNumber(1)), 'length'),
        ops
      );
      expect(result).toEqual(mkUndefined());
    });
  });

  // ---------------------------------------------------------------
  // 12. Call recurses into callee and args
  // ---------------------------------------------------------------
  describe('Call', () => {
    it('recurses into callee and args', () => {
      const ops = makeOps({ a: 10 });
      const result = simplifyAst(
        mkCall(mkIdent('fn'), [mkIdent('a'), mkNumber(2)]),
        ops
      );
      expect(result.type).toBe('Call');
      expect((result as any).callee).toEqual(mkIdent('fn'));
      expect((result as any).args).toEqual([mkNumber(10), mkNumber(2)]);
    });
  });

  // ---------------------------------------------------------------
  // 13. Lambda recurses into body
  // ---------------------------------------------------------------
  describe('Lambda', () => {
    it('recurses into body', () => {
      const ops = makeOps({ y: 5 });
      const result = simplifyAst(
        mkLambda(['x'], mkBinary('+', mkIdent('x'), mkIdent('y'))),
        ops
      );
      expect(result.type).toBe('Lambda');
      expect((result as any).params).toEqual(['x']);
      const body = (result as any).body;
      expect(body.type).toBe('Binary');
      expect(body.right).toEqual(mkNumber(5));
    });
  });

  // ---------------------------------------------------------------
  // 14. FunctionDef recurses into body
  // ---------------------------------------------------------------
  describe('FunctionDef', () => {
    it('recurses into body', () => {
      const ops = makeOps({ c: 100 });
      const result = simplifyAst(
        mkFunctionDef('myFn', ['a', 'b'], mkBinary('+', mkIdent('a'), mkIdent('c'))),
        ops
      );
      expect(result.type).toBe('FunctionDef');
      expect((result as any).name).toBe('myFn');
      expect((result as any).params).toEqual(['a', 'b']);
      const body = (result as any).body;
      expect(body.type).toBe('Binary');
      expect(body.right).toEqual(mkNumber(100));
    });
  });

  // ---------------------------------------------------------------
  // 15. Case with subject, arms, and else
  // ---------------------------------------------------------------
  describe('Case', () => {
    it('recurses into subject, arms, and else branch', () => {
      const ops = makeOps({ v: 42 });
      const result = simplifyAst(
        mkCase(
          mkIdent('v'),
          [
            { when: mkNumber(1), then: mkString('one') },
            { when: mkIdent('v'), then: mkString('match') },
          ],
          mkString('default')
        ),
        ops
      );
      expect(result.type).toBe('Case');
      const c = result as any;
      expect(c.subject).toEqual(mkNumber(42));
      expect(c.arms[0].when).toEqual(mkNumber(1));
      expect(c.arms[0].then).toEqual(mkString('one'));
      expect(c.arms[1].when).toEqual(mkNumber(42));
      expect(c.arms[1].then).toEqual(mkString('match'));
      expect(c.else).toEqual(mkString('default'));
    });

    it('handles null subject and null else', () => {
      const ops = makeOps();
      const result = simplifyAst(
        mkCase(null, [{ when: mkBool(true), then: mkNumber(1) }], null),
        ops
      );
      expect(result.type).toBe('Case');
      const c = result as any;
      expect(c.subject).toBeNull();
      expect(c.else).toBeNull();
    });
  });

  // ---------------------------------------------------------------
  // 16. Sequence
  // ---------------------------------------------------------------
  describe('Sequence', () => {
    it('recurses into all statements', () => {
      const ops = makeOps({ a: 1 });
      const result = simplifyAst(
        mkSequence([mkIdent('a'), mkBinary('+', mkNumber(2), mkNumber(3))]),
        ops
      );
      expect(result.type).toBe('Sequence');
      const seq = result as any;
      expect(seq.statements[0]).toEqual(mkNumber(1));
      expect(seq.statements[1]).toEqual(mkNumber(5));
    });
  });

  // ---------------------------------------------------------------
  // 17. Paren
  // ---------------------------------------------------------------
  describe('Paren', () => {
    it('recurses into inner', () => {
      const ops = makeOps();
      const result = simplifyAst(
        mkParen(mkBinary('+', mkNumber(1), mkNumber(2))),
        ops
      );
      expect(result.type).toBe('Paren');
      expect((result as any).inner).toEqual(mkNumber(3));
    });
  });

  // ---------------------------------------------------------------
  // 18. ArrayLit with ArraySpread
  // ---------------------------------------------------------------
  describe('ArrayLit with ArraySpread', () => {
    it('recurses into regular elements', () => {
      const ops = makeOps({ x: 10 });
      const result = simplifyAst(
        mkArray([mkIdent('x'), mkNumber(2)]),
        ops
      );
      expect(result.type).toBe('ArrayLit');
      const arr = result as any;
      expect(arr.elements[0]).toEqual(mkNumber(10));
      expect(arr.elements[1]).toEqual(mkNumber(2));
    });

    it('recurses into ArraySpread arguments', () => {
      const ops = makeOps({ items: [1, 2, 3] });
      const result = simplifyAst(
        mkArray([mkNumber(0), mkArraySpread(mkIdent('items'))]),
        ops
      );
      expect(result.type).toBe('ArrayLit');
      const arr = result as any;
      expect(arr.elements[0]).toEqual(mkNumber(0));
      expect(arr.elements[1].type).toBe('ArraySpread');
      expect(arr.elements[1].argument).toEqual(mkRaw([1, 2, 3]));
    });
  });

  // ---------------------------------------------------------------
  // 19. ObjectLit with ObjectSpread
  // ---------------------------------------------------------------
  describe('ObjectLit with ObjectSpread', () => {
    it('recurses into property values', () => {
      const ops = makeOps({ x: 10 });
      const result = simplifyAst(
        mkObject([{ key: 'a', value: mkIdent('x') }]),
        ops
      );
      expect(result.type).toBe('ObjectLit');
      const obj = result as any;
      expect(obj.properties[0].key).toBe('a');
      expect(obj.properties[0].value).toEqual(mkNumber(10));
    });

    it('recurses into ObjectSpread arguments', () => {
      const ops = makeOps({ base: { a: 1 } });
      const result = simplifyAst(
        mkObject([
          mkObjectSpread(mkIdent('base')),
          { key: 'b', value: mkNumber(2) },
        ]),
        ops
      );
      expect(result.type).toBe('ObjectLit');
      const obj = result as any;
      expect(obj.properties[0].type).toBe('ObjectSpread');
      expect(obj.properties[0].argument).toEqual(mkRaw({ a: 1 }));
      expect(obj.properties[1].key).toBe('b');
      expect(obj.properties[1].value).toEqual(mkNumber(2));
    });

    it('preserves quoted flag on properties', () => {
      const ops = makeOps();
      const result = simplifyAst(
        mkObject([{ key: 'a', value: mkNumber(1), quoted: true }]),
        ops
      );
      expect(result.type).toBe('ObjectLit');
      const obj = result as any;
      expect(obj.properties[0].quoted).toBe(true);
    });
  });

  // ---------------------------------------------------------------
  // literalValue error path
  // ---------------------------------------------------------------
  describe('literalValue error path', () => {
    it('is not directly reachable via simplifyAst (internal guard)', () => {
      // The literalValue function throws when called on a non-literal node.
      // This cannot happen through simplifyAst because isConstLiteral gates
      // the call. We verify indirectly that a non-literal node does NOT fold.
      const ops = makeOps();
      const result = simplifyAst(mkUnary('-', mkIdent('x')), ops);
      expect(result.type).toBe('Unary');
    });
  });
});
