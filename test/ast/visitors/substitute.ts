import { describe, it, expect } from 'vitest';
import { substituteAst } from '../../../src/ast/visitors/substitute.js';
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
  type Node,
} from '../../../src/ast/nodes.js';

const REPLACEMENT = mkNumber(42);

describe('substituteAst', () => {
  // ---- 1. Literals are returned unchanged ----
  describe('literals', () => {
    it('NumberLit is returned unchanged', () => {
      const node = mkNumber(7);
      expect(substituteAst(node, 'x', REPLACEMENT)).toBe(node);
    });

    it('StringLit is returned unchanged', () => {
      const node = mkString('hello');
      expect(substituteAst(node, 'x', REPLACEMENT)).toBe(node);
    });

    it('BoolLit is returned unchanged', () => {
      const node = mkBool(true);
      expect(substituteAst(node, 'x', REPLACEMENT)).toBe(node);
    });

    it('NullLit is returned unchanged', () => {
      const node = mkNull();
      expect(substituteAst(node, 'x', REPLACEMENT)).toBe(node);
    });

    it('UndefinedLit is returned unchanged', () => {
      const node = mkUndefined();
      expect(substituteAst(node, 'x', REPLACEMENT)).toBe(node);
    });

    it('RawLit is returned unchanged', () => {
      const node = mkRaw({ custom: true });
      expect(substituteAst(node, 'x', REPLACEMENT)).toBe(node);
    });
  });

  // ---- 2. NameRef is NOT substituted ----
  describe('NameRef', () => {
    it('is returned unchanged even when name matches variable', () => {
      const node = mkNameRef('x');
      expect(substituteAst(node, 'x', REPLACEMENT)).toBe(node);
    });
  });

  // ---- 3. Ident matching ----
  describe('Ident', () => {
    it('matching name is replaced with replacement node', () => {
      const node = mkIdent('x');
      const result = substituteAst(node, 'x', REPLACEMENT);
      expect(result).toBe(REPLACEMENT);
    });

    // ---- 4. Ident not matching ----
    it('non-matching name is returned unchanged', () => {
      const node = mkIdent('y');
      expect(substituteAst(node, 'x', REPLACEMENT)).toBe(node);
    });
  });

  // ---- 5. ArrayLit ----
  describe('ArrayLit', () => {
    it('elements are recursed', () => {
      const node = mkArray([mkIdent('x'), mkNumber(1)]);
      const result = substituteAst(node, 'x', REPLACEMENT) as ReturnType<typeof mkArray>;
      expect(result.type).toBe('ArrayLit');
      expect(result.elements).toHaveLength(2);
      expect(result.elements[0]).toEqual(REPLACEMENT);
      expect(result.elements[1]).toEqual(mkNumber(1));
    });

    // ---- 6. ArrayLit with ArraySpread ----
    it('ArraySpread argument is recursed', () => {
      const node = mkArray([mkArraySpread(mkIdent('x'))]);
      const result = substituteAst(node, 'x', REPLACEMENT) as ReturnType<typeof mkArray>;
      expect(result.type).toBe('ArrayLit');
      expect(result.elements).toHaveLength(1);
      const spread = result.elements[0] as ReturnType<typeof mkArraySpread>;
      expect(spread.type).toBe('ArraySpread');
      expect(spread.argument).toEqual(REPLACEMENT);
    });
  });

  // ---- 7. ObjectLit ----
  describe('ObjectLit', () => {
    it('property values are recursed but keys are not', () => {
      const node = mkObject([{ key: 'k', value: mkIdent('x'), quoted: false }]);
      const result = substituteAst(node, 'x', REPLACEMENT) as ReturnType<typeof mkObject>;
      expect(result.type).toBe('ObjectLit');
      expect(result.properties).toHaveLength(1);
      const prop = result.properties[0] as { key: string; value: Node; quoted: boolean };
      expect(prop.key).toBe('k');
      expect(prop.value).toEqual(REPLACEMENT);
      expect(prop.quoted).toBe(false);
    });

    // ---- 8. ObjectLit with ObjectSpread ----
    it('ObjectSpread argument is recursed', () => {
      const node = mkObject([mkObjectSpread(mkIdent('x'))]);
      const result = substituteAst(node, 'x', REPLACEMENT) as ReturnType<typeof mkObject>;
      expect(result.type).toBe('ObjectLit');
      expect(result.properties).toHaveLength(1);
      const spread = result.properties[0] as { type: 'ObjectSpread'; argument: Node };
      expect(spread.type).toBe('ObjectSpread');
      expect(spread.argument).toEqual(REPLACEMENT);
    });
  });

  // ---- 9. Member ----
  describe('Member', () => {
    it('object is recursed, property string stays', () => {
      const node = mkMember(mkIdent('x'), 'prop');
      const result = substituteAst(node, 'x', REPLACEMENT) as ReturnType<typeof mkMember>;
      expect(result.type).toBe('Member');
      expect(result.object).toEqual(REPLACEMENT);
      expect(result.property).toBe('prop');
    });
  });

  // ---- 10. Unary ----
  describe('Unary', () => {
    it('operand is recursed', () => {
      const node = mkUnary('-', mkIdent('x'));
      const result = substituteAst(node, 'x', REPLACEMENT) as ReturnType<typeof mkUnary>;
      expect(result.type).toBe('Unary');
      expect(result.op).toBe('-');
      expect(result.operand).toEqual(REPLACEMENT);
    });
  });

  // ---- 11. Binary ----
  describe('Binary', () => {
    it('both sides are recursed', () => {
      const node = mkBinary('+', mkIdent('x'), mkNumber(1));
      const result = substituteAst(node, 'x', REPLACEMENT) as ReturnType<typeof mkBinary>;
      expect(result.type).toBe('Binary');
      expect(result.op).toBe('+');
      expect(result.left).toEqual(REPLACEMENT);
      expect(result.right).toEqual(mkNumber(1));
    });
  });

  // ---- 12. Ternary ----
  describe('Ternary', () => {
    it('all three parts are recursed', () => {
      const node = mkTernary('?', mkIdent('x'), mkNumber(1), mkNumber(2));
      const result = substituteAst(node, 'x', REPLACEMENT) as ReturnType<typeof mkTernary>;
      expect(result.type).toBe('Ternary');
      expect(result.op).toBe('?');
      expect(result.a).toEqual(REPLACEMENT);
      expect(result.b).toEqual(mkNumber(1));
      expect(result.c).toEqual(mkNumber(2));
    });
  });

  // ---- 13. Call ----
  describe('Call', () => {
    it('callee and args are recursed', () => {
      const node = mkCall(mkIdent('fn'), [mkIdent('x')]);
      const result = substituteAst(node, 'x', REPLACEMENT) as ReturnType<typeof mkCall>;
      expect(result.type).toBe('Call');
      // callee is 'fn', not 'x', so it stays
      expect(result.callee).toEqual(mkIdent('fn'));
      expect(result.args).toHaveLength(1);
      expect(result.args[0]).toEqual(REPLACEMENT);
    });
  });

  // ---- 14. Lambda ----
  describe('Lambda', () => {
    it('body is recursed, params are preserved', () => {
      const node = mkLambda(['y'], mkIdent('x'));
      const result = substituteAst(node, 'x', REPLACEMENT) as ReturnType<typeof mkLambda>;
      expect(result.type).toBe('Lambda');
      expect(result.params).toEqual(['y']);
      expect(result.body).toEqual(REPLACEMENT);
    });
  });

  // ---- 15. FunctionDef ----
  describe('FunctionDef', () => {
    it('body is recursed, name and params are preserved', () => {
      const node = mkFunctionDef('f', ['y'], mkIdent('x'));
      const result = substituteAst(node, 'x', REPLACEMENT) as ReturnType<typeof mkFunctionDef>;
      expect(result.type).toBe('FunctionDef');
      expect(result.name).toBe('f');
      expect(result.params).toEqual(['y']);
      expect(result.body).toEqual(REPLACEMENT);
    });
  });

  // ---- 16. Case ----
  describe('Case', () => {
    it('subject, arm when/then, and else are all recursed', () => {
      const node = mkCase(
        mkIdent('x'),
        [{ when: mkIdent('x'), then: mkIdent('x') }],
        mkIdent('x')
      );
      const result = substituteAst(node, 'x', REPLACEMENT) as ReturnType<typeof mkCase>;
      expect(result.type).toBe('Case');
      expect(result.subject).toEqual(REPLACEMENT);
      expect(result.arms).toHaveLength(1);
      expect(result.arms[0].when).toEqual(REPLACEMENT);
      expect(result.arms[0].then).toEqual(REPLACEMENT);
      expect(result.else).toEqual(REPLACEMENT);
    });

    it('handles null subject and null else', () => {
      const node = mkCase(
        null,
        [{ when: mkIdent('x'), then: mkNumber(1) }],
        null
      );
      const result = substituteAst(node, 'x', REPLACEMENT) as ReturnType<typeof mkCase>;
      expect(result.type).toBe('Case');
      expect(result.subject).toBeNull();
      expect(result.arms[0].when).toEqual(REPLACEMENT);
      expect(result.arms[0].then).toEqual(mkNumber(1));
      expect(result.else).toBeNull();
    });
  });

  // ---- 17. Sequence ----
  describe('Sequence', () => {
    it('all statements are recursed', () => {
      const node = mkSequence([mkIdent('x'), mkIdent('y')]);
      const result = substituteAst(node, 'x', REPLACEMENT) as ReturnType<typeof mkSequence>;
      expect(result.type).toBe('Sequence');
      expect(result.statements).toHaveLength(2);
      expect(result.statements[0]).toEqual(REPLACEMENT);
      expect(result.statements[1]).toEqual(mkIdent('y'));
    });
  });

  // ---- 18. Paren ----
  describe('Paren', () => {
    it('inner is recursed', () => {
      const node = mkParen(mkIdent('x'));
      const result = substituteAst(node, 'x', REPLACEMENT) as ReturnType<typeof mkParen>;
      expect(result.type).toBe('Paren');
      expect(result.inner).toEqual(REPLACEMENT);
    });
  });
});
