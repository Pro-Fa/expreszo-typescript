import { expect, describe, it } from 'vitest';
import { Parser } from '../../index.js';

// Expression Methods Tests - Converted from expression.js
// Tests for substitute(), simplify(), variables(), symbols(), and toString() methods

const parser = new Parser();

describe('Expression methods', () => {
  describe('substitute()', () => {
    const parser = new Parser();

    it('substitute() should replace variables with values', () => {
      const expr = parser.parse('x * (y * 2)');
      expect(expr.substitute('x', '3').toString()).toBe('(3 * (y * 2))');
      expect(expr.substitute('y', '4').toString()).toBe('(x * (4 * 2))');
    });

    it('substitute() should work with complex expressions', () => {
      const expr = parser.parse('a + b * c');
      expect(expr.substitute('b', '5').substitute('c', '2').toString()).toBe('(a + (5 * 2))');
    });
  });

  describe('simplify()', () => {
    const parser = new Parser();

    it('simplify() basic math operations', () => {
      expect(parser.parse('3 + 4').simplify().toString()).toBe('7');
      expect(parser.parse('2 * 5').simplify().toString()).toBe('10');
      expect(parser.parse('10 - 3').simplify().toString()).toBe('7');
      expect(parser.parse('12 / 4').simplify().toString()).toBe('3');
    });

    it('simplify() with variables', () => {
      expect(parser.parse('x + 0').simplify().toString()).toBe('(x + 0)');
      expect(parser.parse('x * 1').simplify().toString()).toBe('(x * 1)');
      expect(parser.parse('x * 0').simplify().toString()).toBe('(x * 0)');
    });

    it('simplify() with arrays', () => {
      const expr = parser.parse('a[2] + b[3]');
      expect(expr.simplify({ a: [0, 0, 5, 0], b: [0, 0, 0, 4, 0] }).toString()).toBe('9');
      expect(expr.simplify({ a: [0, 0, 5, 0] }).toString()).toBe('(5 + b[3])');
      expect(parser.parse('a[2] + b[5 - 2]').simplify({ b: [0, 0, 0, 4, 0] }).toString()).toBe('(a[2] + 4)');
      expect(parser.parse('a[two] + b[3]').simplify({ a: [0, 0, 5, 0], b: [0, 0, 0, 4, 0] }).toString()).toBe('([0, 0, 5, 0][two] + 4)');
      expect(parser.parse('a[two] + b[3]').simplify({ a: [0, 'New\nLine', 5, 0], b: [0, 0, 0, 4, 0] }).toString()).toBe('([0, "New\\nLine", 5, 0][two] + 4)');
    });
  });

  describe('variables()', () => {
    it('should return variable names', () => {
      const expr = parser.parse('x * (y * atan2(1, 2)) + z.y.x');
      expect(expr.variables()).toEqual(['x', 'y', 'z']);
    });

    it('should return variables after simplification', () => {
      const expr = parser.parse('x * (y * atan2(1, 2)) + z.y.x');
      expect(expr.simplify({ y: 4 }).variables()).toEqual(['x', 'z']);
      expect(expr.simplify({ y: 4, z: { y: { x: 5 } } }).variables()).toEqual(['x']);
    });

    it('should handle conditional expressions', () => {
      expect(parser.parse('a or b ? c + d : e * f').variables()).toEqual(['a', 'b', 'c', 'd', 'e', 'f']);
    });

    it('should handle special variable names', () => {
      expect(parser.parse('$x * $y_+$a1*$z - $b2').variables()).toEqual(['$x', '$y_', '$a1', '$z', '$b2']);
    });

    it('should handle member access', () => {
      expect(parser.parse('user.age + 2').variables()).toEqual(['user']);
      expect(parser.parse('user.age + 2').variables({ withMembers: false })).toEqual(['user']);

      const expr = parser.parse('user.age + 2');
      expect(expr.variables({ withMembers: true })).toEqual(['user.age']);
    });

    it('should handle complex member access with withMembers option', () => {
      const expr1 = parser.parse('x.y ? x.y.z : default.z');
      expect(expr1.variables({ withMembers: true })).toEqual(['x.y.z', 'default.z', 'x.y']);

      const expr2 = parser.parse('x + x.y + x.z');
      expect(expr2.variables({ withMembers: true })).toEqual(['x', 'x.y', 'x.z']);

      const expr3 = parser.parse('x.y < 3 ? 2 * x.y.z : default.z + 1');
      expect(expr3.variables({ withMembers: true })).toEqual(['x.y', 'x.y.z', 'default.z']);

      const expr4 = parser.parse('user.age');
      expect(expr4.variables({ withMembers: true })).toEqual(['user.age']);

      const expr5 = parser.parse('x');
      expect(expr5.variables({ withMembers: true })).toEqual(['x']);
      expect(expr5.variables({ withMembers: false })).toEqual(['x']);
    });

    it('should handle function calls with member access', () => {
      const expr1 = parser.parse('max(conf.limits.lower, conf.limits.upper)');
      expect(expr1.variables({ withMembers: false })).toEqual(['conf']);
      expect(expr1.variables({ withMembers: true })).toEqual(['conf.limits.lower', 'conf.limits.upper']);

      const expr2 = parser.parse('fn.max(conf.limits.lower, conf.limits.upper)');
      expect(expr2.variables({ withMembers: false })).toEqual(['fn', 'conf']);
      expect(expr2.variables({ withMembers: true })).toEqual(['fn.max', 'conf.limits.lower', 'conf.limits.upper']);
    });

    it('should handle assignment expressions', () => {
      expect(new Parser().parse('x = y + z').variables()).toEqual(['x', 'y', 'z']);

      const parser = new Parser();
      expect(parser.parse('f(x, y, z) = x + y + z').variables()).toEqual(['f', 'x', 'y', 'z']);
      expect(new Parser().parse('x = y ?? 3 + z').variables()).toEqual(['x', 'y', 'z']);
    });
  });

  describe('symbols()', () => {
    it('should return symbols including functions', () => {
      const expr = parser.parse('x * (y * atan2(1, 2)) + z.y.x');
      expect(expr.symbols()).toEqual(['x', 'y', 'atan2', 'z']);
    });

    it('should return symbols after simplification', () => {
      const expr = parser.parse('x * (y * atan2(1, 2)) + z.y.x');
      expect(expr.simplify({ y: 4 }).symbols()).toEqual(['x', 'atan2', 'z']);
      expect(expr.simplify({ y: 4, z: { y: { x: 5 } } }).symbols()).toEqual(['x', 'atan2']);
    });

    it('should handle conditional expressions', () => {
      expect(parser.parse('a or b ? c + d : e * f').symbols()).toEqual(['a', 'b', 'c', 'd', 'e', 'f']);
    });

    it('should handle member access', () => {
      expect(parser.parse('user.age + 2').symbols()).toEqual(['user']);
      expect(parser.parse('user.age + 2').symbols({ withMembers: false })).toEqual(['user']);

      const expr = parser.parse('user.age + 2');
      expect(expr.symbols({ withMembers: true })).toEqual(['user.age']);
    });

    it('should handle complex member access with withMembers option', () => {
      const expr1 = parser.parse('x.y ? x.y.z : default.z');
      expect(expr1.symbols({ withMembers: true })).toEqual(['x.y.z', 'default.z', 'x.y']);

      const expr2 = parser.parse('x.y < 3 ? 2 * x.y.z : default.z + 1');
      expect(expr2.symbols({ withMembers: true })).toEqual(['x.y', 'x.y.z', 'default.z']);

      const expr3 = parser.parse('user.age');
      expect(expr3.symbols({ withMembers: true })).toEqual(['user.age']);

      const expr4 = parser.parse('x');
      expect(expr4.symbols({ withMembers: true })).toEqual(['x']);
      expect(expr4.symbols({ withMembers: false })).toEqual(['x']);
    });

    it('should handle assignment expressions', () => {
      expect(new Parser().parse('x = y + z').symbols()).toEqual(['x', 'y', 'z']);
      expect(new Parser().parse('x = y ?? 3 + z').symbols()).toEqual(['x', 'y', 'z']);
    });
  });

  describe('toString()', () => {
    const parser = new Parser();

    describe('core features', () => {
      it('should handle basic operations', () => {
        expect(parser.parse('2 ^ x').toString()).toBe('(2 ^ x)');
        expect(parser.parse('2 * x + 1').toString()).toBe('((2 * x) + 1)');
        expect(parser.parse('2 + 3 * x').toString()).toBe('(2 + (3 * x))');
        expect(parser.parse('(2 + 3) * x').toString()).toBe('((2 + 3) * x)');
      });

      it('should handle unary operators', () => {
        expect(parser.parse('2-3^x').toString()).toBe('(2 - (3 ^ x))');
        expect(parser.parse('-2-3^x').toString()).toBe('((-2) - (3 ^ x))');
        expect(parser.parse('-3^x').toString()).toBe('(-(3 ^ x))');
        expect(parser.parse('(-3)^x').toString()).toBe('((-3) ^ x)');
        expect(parser.parse('10*-1').toString()).toBe('(10 * (-1))');
        expect(parser.parse('10+-1').toString()).toBe('(10 + (-1))');
        expect(parser.parse('10+ +1').toString()).toBe('(10 + (+1))');
      });

      it('should handle member access', () => {
        expect(parser.parse('2 ^ x.y').toString()).toBe('(2 ^ x.y)');
        expect(parser.parse('2 + 3 * foo.bar.baz').toString()).toBe('(2 + (3 * foo.bar.baz))');
      });

      it('should handle function calls', () => {
        expect(parser.parse('sqrt 10/-1').toString()).toBe('((sqrt 10) / (-1))');
        expect(parser.parse('sin 2^-4').toString()).toBe('(sin (2 ^ (-4)))');
        expect(parser.parse('floor(random() * 10)').toString()).toBe('(floor (random() * 10))');
        expect(parser.parse('hypot(random(), max(2, x, y))').toString()).toBe('hypot(random(), max(2, x, y))');
      });

      it('should handle conditional expressions', () => {
        expect(parser.parse('a ? b : c').toString()).toBe('(a ? (b) : (c))');
        expect(parser.parse('a ? b : c ? d : e').toString()).toBe('(a ? (b) : ((c ? (d) : (e))))');
        expect(parser.parse('a ? b ? c : d : e').toString()).toBe('(a ? ((b ? (c) : (d))) : (e))');
        expect(parser.parse('a == 2 ? b + 1 : c * 2').toString()).toBe('((a == 2) ? ((b + 1)) : ((c * 2)))');
      });

      it('should handle logical operators', () => {
        expect(parser.parse('not 0 or 1 and 2').toString()).toBe('((not 0) or ((1 and (2))))');
        expect(parser.parse('a < b or c > d and e <= f or g >= h and i == j or k != l').toString())
          .toBe('((((a < b) or (((c > d) and ((e <= f))))) or (((g >= h) and ((i == j))))) or ((k != l)))');
      });

      it('should handle assignment and sequences', () => {
        expect(parser.parse('x = x + 1').toString()).toBe('(x = ((x + 1)))');
        expect(parser.parse('x = y = x + 1').toString()).toBe('(x = ((y = ((x + 1)))))');
        expect(parser.parse('3 ; 2 ; 1').toString()).toBe('(3;(2;1))');
        expect(parser.parse('3 ; 2 ; 1 ;').toString()).toBe('(3;(2;(1)))');

        const parser2 = new Parser();
        expect(parser2.parse('x = 3 ; y = 4 ; z = x * y').toString()).toBe('((x = (3));((y = (4));(z = ((x * y)))))');
        expect(parser2.parse('2+(x=3;y=4;z=x*y)+5').toString()).toBe('((2 + ((x = (3));((y = (4));(z = ((x * y)))))) + 5)');
      });

      it('should handle arrays', () => {
        expect(parser.parse('[1, 2, 3]').toString()).toBe('[1, 2, 3]');
        expect(parser.parse('[1, 2, 3, [4, [5, 6]]]').toString()).toBe('[1, 2, 3, [4, [5, 6]]]');
        expect(parser.parse('["a", ["b", ["c"]], true, 1 + 2 + 3]').toString()).toBe('["a", ["b", ["c"]], true, ((1 + 2) + 3)]');
        expect(parser.parse('[1, 2+3, a, "5"]').toString()).toBe('[1, (2 + 3), a, "5"]');
        expect(parser.parse('a[0]').toString()).toBe('a[0]');
        expect(parser.parse('a[2 + 3]').toString()).toBe('a[(2 + 3)]');
      });

      it('should handle string operations', () => {
        expect(parser.parse('\'as\' | \'df\'').toString()).toBe('("as" | "df")');
        expect(parser.parse('\'A\\bB\\tC\\nD\\fE\\r\\\'F\\\\G\'').toString()).toBe('"A\\bB\\tC\\nD\\fE\\r\'F\\\\G"');
      });

      it('should handle factorials', () => {
        expect(parser.parse('(x - 1)!').toString()).toBe('((x - 1)!)');
      });

      it('should parenthesize negative numbers', () => {
        expect(parser.parse('x + y').simplify({ y: -2 }).toString()).toBe('(x + (-2))');
        expect(parser.parse('x + (2 - 3)').simplify().toString()).toBe('(x + (-1))');
      });
    });

    describe('fork features', () => {
      it('should handle nullish coalescing', () => {
        expect(parser.parse('2 ?? 3 + 2').toString()).toBe('((2 ?? 3) + 2)');
        expect(parser.parse('undefined ?? 3 + 2').toString()).toBe('((undefined ?? 3) + 2)');
      });

      it('should handle conversion operator', () => {
        const parser2 = new Parser({ operators: { conversion: true } });
        expect(parser2.parse('"1.6" as "number"').toString()).toBe('("1.6" as "number")');
      });

      it('should handle case statements', () => {
        expect(
          parser.parse('case when x > 0 then "greater" when x < 0 then "less" else "equal" end').toString()
        ).toBe('case when (x > 0) then "greater" when (x < 0) then "less" else "equal" end');

        expect(
          parser.parse('case x * x when 1 then "one" when 4 then "four" else "big" end').toString()
        ).toBe('case (x * x) when 1 then "one" when 4 then "four" else "big" end');
      });

      it('should handle object construction', () => {
        expect(
          parser.parse('{ x: a + b, y: { key: a^b, value: getValue(a^b) }, z: c + "_extra" }').toString()
        ).toBe('{ x: (a + b), y: { key: (a ^ b), value: getValue((a ^ b)) }, z: (c + "_extra") }');
      });
    });
  });

});
