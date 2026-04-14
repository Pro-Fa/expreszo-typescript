/* global describe, it */

import assert from 'assert';
import { Parser } from '../../index';

describe('Collection Array Functions', function () {
  const parser = new Parser();

  describe('range(start, end, step?)', function () {
    it('generates an exclusive ascending sequence', function () {
      assert.deepStrictEqual(parser.evaluate('range(0, 5)'), [0, 1, 2, 3, 4]);
    });
    it('supports a custom step', function () {
      assert.deepStrictEqual(parser.evaluate('range(0, 10, 2)'), [0, 2, 4, 6, 8]);
    });
    it('supports negative step for descending sequences', function () {
      assert.deepStrictEqual(parser.evaluate('range(10, 0, -2)'), [10, 8, 6, 4, 2]);
    });
    it('returns an empty array when start equals end', function () {
      assert.deepStrictEqual(parser.evaluate('range(5, 5)'), []);
    });
    it('returns an empty array on direction mismatch', function () {
      assert.deepStrictEqual(parser.evaluate('range(0, 5, -1)'), []);
      assert.deepStrictEqual(parser.evaluate('range(5, 0)'), []);
    });
    it('throws when step is zero', function () {
      assert.throws(() => parser.evaluate('range(0, 5, 0)'), /step/);
    });
  });

  describe('chunk(array, size)', function () {
    it('splits into equal-sized groups', function () {
      assert.deepStrictEqual(
        parser.evaluate('chunk([1, 2, 3, 4, 5, 6], 3)'),
        [[1, 2, 3], [4, 5, 6]]
      );
    });
    it('leaves a shorter final chunk', function () {
      assert.deepStrictEqual(
        parser.evaluate('chunk([1, 2, 3, 4, 5, 6, 7], 2)'),
        [[1, 2], [3, 4], [5, 6], [7]]
      );
    });
    it('returns a single chunk when size exceeds length', function () {
      assert.deepStrictEqual(parser.evaluate('chunk([1, 2, 3], 5)'), [[1, 2, 3]]);
    });
    it('returns an empty array for an empty input', function () {
      assert.deepStrictEqual(parser.evaluate('chunk([], 3)'), []);
    });
    it('throws on non-positive size', function () {
      assert.throws(() => parser.evaluate('chunk([1, 2], 0)'), /chunk/);
    });
  });

  describe('union(...arrays)', function () {
    it('deduplicates and preserves first-seen order', function () {
      assert.deepStrictEqual(
        parser.evaluate('union([1, 2, 3], [2, 3, 4])'),
        [1, 2, 3, 4]
      );
    });
    it('accepts more than two arrays', function () {
      assert.deepStrictEqual(
        parser.evaluate('union([1], [2], [1, 3])'),
        [1, 2, 3]
      );
    });
    it('returns an empty array when called with no arguments', function () {
      assert.deepStrictEqual(parser.evaluate('union()'), []);
    });
  });

  describe('intersect(...arrays)', function () {
    it('returns elements present in all arrays', function () {
      assert.deepStrictEqual(
        parser.evaluate('intersect([1, 2, 3], [2, 3, 4])'),
        [2, 3]
      );
    });
    it('deduplicates results', function () {
      assert.deepStrictEqual(
        parser.evaluate('intersect([1, 2, 2, 3], [2, 3, 3])'),
        [2, 3]
      );
    });
    it('handles more than two arrays', function () {
      assert.deepStrictEqual(
        parser.evaluate('intersect([1, 2, 3], [2, 3, 4], [3, 2])'),
        [2, 3]
      );
    });
    it('returns empty when nothing overlaps', function () {
      assert.deepStrictEqual(parser.evaluate('intersect([1, 2], [3, 4])'), []);
    });
  });

  describe('groupBy(array, keyFn)', function () {
    it('groups by the computed key', function () {
      assert.deepStrictEqual(
        parser.evaluate('groupBy([1, 2, 3, 4, 5, 6], n => n % 2 == 0 ? "even" : "odd")'),
        { odd: [1, 3, 5], even: [2, 4, 6] }
      );
    });
    it('works with objects and named functions', function () {
      assert.deepStrictEqual(
        parser.evaluate(
          'role(u) = u.role; groupBy([{name: "Ada", role: "admin"}, {name: "Bob", role: "user"}, {name: "Cara", role: "admin"}], role)'
        ),
        {
          admin: [
            { name: 'Ada', role: 'admin' },
            { name: 'Cara', role: 'admin' }
          ],
          user: [{ name: 'Bob', role: 'user' }]
        }
      );
    });
    it('returns undefined when the array is undefined', function () {
      assert.strictEqual(parser.evaluate('groupBy(undefined, x => x)'), undefined);
    });
  });

  describe('countBy(array, keyFn)', function () {
    it('counts elements per key', function () {
      assert.deepStrictEqual(
        parser.evaluate('countBy([1, 2, 3, 4, 5], n => n > 2 ? "big" : "small")'),
        { small: 2, big: 3 }
      );
    });
    it('works on strings', function () {
      assert.deepStrictEqual(
        parser.evaluate('countBy(["apple", "avocado", "banana"], s => left(s, 1))'),
        { a: 2, b: 1 }
      );
    });
  });
});
