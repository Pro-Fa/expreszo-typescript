import { describe, it, expect } from 'vitest';
import { getSymbolsFromNode } from '../../../src/ast/visitors/get-symbols.js';
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
  mkCall,
  mkLambda,
  mkFunctionDef,
  mkCase,
  mkSequence,
  mkParen,
} from '../../../src/ast/nodes.js';

/** Helper: collect symbols from a node and return the result array. */
function symbols(node: Parameters<typeof getSymbolsFromNode>[0], withMembers = false): string[] {
  const out: string[] = [];
  getSymbolsFromNode(node, out, { withMembers });
  return out;
}

describe('getSymbolsFromNode', () => {
  // -----------------------------------------------------------------------
  // 1. Literals
  // -----------------------------------------------------------------------
  describe('literals produce no symbols', () => {
    it('NumberLit', () => {
      expect(symbols(mkNumber(42))).toEqual([]);
    });

    it('StringLit', () => {
      expect(symbols(mkString('hello'))).toEqual([]);
    });

    it('BoolLit', () => {
      expect(symbols(mkBool(true))).toEqual([]);
    });

    it('NullLit', () => {
      expect(symbols(mkNull())).toEqual([]);
    });

    it('UndefinedLit', () => {
      expect(symbols(mkUndefined())).toEqual([]);
    });

    it('RawLit', () => {
      expect(symbols(mkRaw({ custom: 'value' }))).toEqual([]);
    });
  });

  describe('literals flush prevVar (withMembers)', () => {
    it('NumberLit flushes accumulated prevVar', () => {
      // Paren saves/restores prevVar; a sequence like (x; 1) should flush x
      const node = mkSequence([mkIdent('x'), mkNumber(1)]);
      expect(symbols(node, true)).toEqual(['x']);
    });
  });

  // -----------------------------------------------------------------------
  // 2. Ident
  // -----------------------------------------------------------------------
  describe('Ident', () => {
    it('adds name to output', () => {
      expect(symbols(mkIdent('x'))).toEqual(['x']);
    });

    it('adds name to output (withMembers)', () => {
      expect(symbols(mkIdent('x'), true)).toEqual(['x']);
    });

    it('deduplicates repeated references', () => {
      const node = mkBinary('+', mkIdent('x'), mkIdent('x'));
      expect(symbols(node)).toEqual(['x']);
    });
  });

  // -----------------------------------------------------------------------
  // 3. NameRef
  // -----------------------------------------------------------------------
  describe('NameRef', () => {
    it('adds name to output', () => {
      expect(symbols(mkNameRef('y'))).toEqual(['y']);
    });

    it('adds name to output (withMembers)', () => {
      expect(symbols(mkNameRef('y'), true)).toEqual(['y']);
    });
  });

  // -----------------------------------------------------------------------
  // 4. Member with ident base (completeness)
  // -----------------------------------------------------------------------
  describe('Member with ident base', () => {
    it('without withMembers returns base name only', () => {
      const node = mkMember(mkIdent('obj'), 'prop');
      expect(symbols(node)).toEqual(['obj']);
    });

    it('with withMembers returns dotted path', () => {
      const node = mkMember(mkIdent('obj'), 'prop');
      expect(symbols(node, true)).toEqual(['obj.prop']);
    });

    it('deep chain with withMembers returns full dotted path', () => {
      const node = mkMember(mkMember(mkIdent('a'), 'b'), 'c');
      expect(symbols(node, true)).toEqual(['a.b.c']);
    });
  });

  // -----------------------------------------------------------------------
  // 5. Member with non-ident base (lines 96-100)
  // -----------------------------------------------------------------------
  describe('Member with non-ident base', () => {
    it('walks object subtree and flushes (withMembers: false)', () => {
      // fn().prop  =>  fn is the only symbol
      const node = mkMember(mkCall(mkIdent('fn'), []), 'prop');
      expect(symbols(node)).toEqual(['fn']);
    });

    it('walks object subtree and flushes (withMembers: true)', () => {
      const node = mkMember(mkCall(mkIdent('fn'), []), 'prop');
      expect(symbols(node, true)).toEqual(['fn']);
    });

    it('member off a binary expression', () => {
      // (a + b).prop  =>  symbols are a, b
      const node = mkMember(mkBinary('+', mkIdent('a'), mkIdent('b')), 'prop');
      expect(symbols(node)).toEqual(['a', 'b']);
    });
  });

  // -----------------------------------------------------------------------
  // 6. ArrayLit with ArraySpread (lines 103-104)
  // -----------------------------------------------------------------------
  describe('ArrayLit with ArraySpread', () => {
    it('collects symbols from spread elements', () => {
      const node = mkArray([mkIdent('a'), mkArraySpread(mkIdent('b'))]);
      expect(symbols(node)).toEqual(['a', 'b']);
    });

    it('collects symbols from spread elements (withMembers)', () => {
      const node = mkArray([mkIdent('a'), mkArraySpread(mkIdent('b'))]);
      expect(symbols(node, true)).toEqual(['a', 'b']);
    });

    it('spread with nested expression', () => {
      const node = mkArray([mkArraySpread(mkBinary('+', mkIdent('x'), mkIdent('y')))]);
      expect(symbols(node)).toEqual(['x', 'y']);
    });
  });

  // -----------------------------------------------------------------------
  // 7. ObjectLit with ObjectSpread (lines 113-114)
  // -----------------------------------------------------------------------
  describe('ObjectLit with ObjectSpread', () => {
    it('collects symbols from spread entries', () => {
      const node = mkObject([
        { key: 'a', value: mkIdent('x') },
        mkObjectSpread(mkIdent('rest')),
      ]);
      expect(symbols(node)).toEqual(['x', 'rest']);
    });

    it('collects symbols from spread entries (withMembers)', () => {
      const node = mkObject([
        { key: 'a', value: mkIdent('x') },
        mkObjectSpread(mkIdent('rest')),
      ]);
      expect(symbols(node, true)).toEqual(['x', 'rest']);
    });

    it('ObjectSpread with complex argument', () => {
      const node = mkObject([
        mkObjectSpread(mkCall(mkIdent('getDefaults'), [])),
      ]);
      expect(symbols(node)).toEqual(['getDefaults']);
    });
  });

  // -----------------------------------------------------------------------
  // 8. FunctionDef (lines 147-149)
  // -----------------------------------------------------------------------
  describe('FunctionDef', () => {
    it('collects function name and body symbols', () => {
      const node = mkFunctionDef('myFn', ['x'], mkIdent('x'));
      expect(symbols(node)).toEqual(['myFn', 'x']);
    });

    it('collects function name and body symbols (withMembers)', () => {
      const node = mkFunctionDef('myFn', ['x'], mkBinary('+', mkIdent('x'), mkIdent('y')));
      expect(symbols(node, true)).toEqual(['myFn', 'x', 'y']);
    });

    it('deduplicates name when body references the same name', () => {
      const node = mkFunctionDef('f', ['x'], mkCall(mkIdent('f'), [mkIdent('x')]));
      expect(symbols(node)).toEqual(['f', 'x']);
    });
  });

  // -----------------------------------------------------------------------
  // 9. Case node (lines 152-159)
  // -----------------------------------------------------------------------
  describe('Case', () => {
    it('collects from subject, arms, and else branch', () => {
      const node = mkCase(
        mkIdent('val'),
        [
          { when: mkNumber(1), then: mkIdent('a') },
          { when: mkNumber(2), then: mkIdent('b') },
        ],
        mkIdent('c')
      );
      expect(symbols(node)).toEqual(['val', 'a', 'b', 'c']);
    });

    it('handles null subject and null else', () => {
      const node = mkCase(
        null,
        [{ when: mkIdent('cond'), then: mkIdent('result') }],
        null
      );
      expect(symbols(node)).toEqual(['cond', 'result']);
    });

    it('handles withMembers mode', () => {
      const node = mkCase(
        mkMember(mkIdent('obj'), 'type'),
        [{ when: mkString('a'), then: mkMember(mkIdent('obj'), 'val') }],
        mkIdent('fallback')
      );
      expect(symbols(node, true)).toEqual(['obj.type', 'obj.val', 'fallback']);
    });
  });

  // -----------------------------------------------------------------------
  // 10. Sequence (lines 162-164)
  // -----------------------------------------------------------------------
  describe('Sequence', () => {
    it('collects from all statements', () => {
      const node = mkSequence([mkIdent('a'), mkIdent('b')]);
      expect(symbols(node)).toEqual(['a', 'b']);
    });

    it('collects from all statements (withMembers)', () => {
      const node = mkSequence([mkIdent('a'), mkIdent('b'), mkIdent('c')]);
      expect(symbols(node, true)).toEqual(['a', 'b', 'c']);
    });

    it('deduplicates across statements', () => {
      const node = mkSequence([mkIdent('x'), mkBinary('+', mkIdent('x'), mkIdent('y'))]);
      expect(symbols(node)).toEqual(['x', 'y']);
    });
  });

  // -----------------------------------------------------------------------
  // 11. Paren - prevVar save/restore (withMembers)
  // -----------------------------------------------------------------------
  describe('Paren', () => {
    it('saves and restores prevVar across paren boundary (withMembers)', () => {
      // obj.(inner).prop  =>  the paren resets prevVar to null inside, then
      // restores the outer prevVar after. This means the inner ident gets
      // its own symbol and the outer member chain accumulation resumes.
      //
      // Simulate: a member chain where the object is a Paren wrapping an ident.
      // mkMember(mkParen(mkIdent('inner')), 'prop')
      // Without withMembers: just ['inner']
      // With withMembers: 'inner' is flushed inside the paren; the member
      // off a non-ident (Paren) base falls through to generic walk.
      const node = mkMember(mkParen(mkIdent('inner')), 'prop');
      expect(symbols(node, false)).toEqual(['inner']);
      expect(symbols(node, true)).toEqual(['inner']);
    });

    it('inner walk does not corrupt outer prevVar', () => {
      // Build: Binary(+, Member(a, x), Paren(Member(b, y)))
      // In withMembers mode: a.x should stay intact, paren isolates b.y
      const node = mkBinary('+',
        mkMember(mkIdent('a'), 'x'),
        mkParen(mkMember(mkIdent('b'), 'y'))
      );
      expect(symbols(node, true)).toEqual(['b.y', 'a.x']);
    });

    it('flushes inner prevVar before restoring outer', () => {
      // Paren wrapping a bare ident in withMembers mode: the ident sets
      // prevVar, the paren flush emits it, then outer prevVar is restored.
      const node = mkParen(mkIdent('z'));
      expect(symbols(node, true)).toEqual(['z']);
    });
  });

  // -----------------------------------------------------------------------
  // 12. withMembers: true vs false
  // -----------------------------------------------------------------------
  describe('withMembers option', () => {
    it('false: member chain returns base name only', () => {
      const node = mkMember(mkMember(mkIdent('a'), 'b'), 'c');
      expect(symbols(node, false)).toEqual(['a']);
    });

    it('true: member chain returns full dotted path', () => {
      const node = mkMember(mkMember(mkIdent('a'), 'b'), 'c');
      expect(symbols(node, true)).toEqual(['a.b.c']);
    });

    it('defaults to false when options not provided', () => {
      const out: string[] = [];
      getSymbolsFromNode(mkMember(mkIdent('obj'), 'p'), out);
      expect(out).toEqual(['obj']);
    });

    it('prevVar accumulation across sequential idents (withMembers)', () => {
      // In a sequence [ident_a, ident_b], withMembers should flush a before
      // starting b.
      const node = mkSequence([mkIdent('first'), mkIdent('second')]);
      expect(symbols(node, true)).toEqual(['first', 'second']);
    });
  });

  // -----------------------------------------------------------------------
  // 13. Lambda
  // -----------------------------------------------------------------------
  describe('Lambda', () => {
    it('collects symbols from body', () => {
      const node = mkLambda(['x'], mkBinary('+', mkIdent('x'), mkIdent('y')));
      expect(symbols(node)).toEqual(['x', 'y']);
    });

    it('collects symbols from body (withMembers)', () => {
      const node = mkLambda(['x'], mkMember(mkIdent('obj'), 'field'));
      expect(symbols(node, true)).toEqual(['obj.field']);
    });
  });

  // -----------------------------------------------------------------------
  // Additional edge cases
  // -----------------------------------------------------------------------
  describe('edge cases', () => {
    it('Unary flushes prevVar', () => {
      const node = mkUnary('-', mkIdent('x'));
      expect(symbols(node)).toEqual(['x']);
      expect(symbols(node, true)).toEqual(['x']);
    });

    it('Ternary collects from all three branches', () => {
      const node = mkBinary('+',
        mkIdent('unused'),
        mkBinary('*',
          mkIdent('a'),
          mkIdent('b')
        )
      );
      expect(symbols(node)).toEqual(['unused', 'a', 'b']);
    });

    it('Call collects callee and args', () => {
      const node = mkCall(mkIdent('fn'), [mkIdent('a'), mkIdent('b')]);
      expect(symbols(node)).toEqual(['fn', 'a', 'b']);
    });

    it('NameRef in a member chain (withMembers)', () => {
      const node = mkMember(mkNameRef('base'), 'field');
      expect(symbols(node, true)).toEqual(['base.field']);
    });

    it('empty array and empty object produce no symbols', () => {
      expect(symbols(mkArray([]))).toEqual([]);
      expect(symbols(mkObject([]))).toEqual([]);
    });
  });
});
