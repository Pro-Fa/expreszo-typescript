/* global describe, it */

import assert from 'assert';
import { Parser } from '../../index';

describe('Object pick/omit', function () {
  const parser = new Parser();

  describe('pick(obj, keys)', function () {
    it('returns only the requested keys', function () {
      assert.deepStrictEqual(
        parser.evaluate('pick({a: 1, b: 2, c: 3}, ["a", "c"])'),
        { a: 1, c: 3 }
      );
    });
    it('silently skips keys not in the source', function () {
      assert.deepStrictEqual(
        parser.evaluate('pick({a: 1, b: 2}, ["a", "z"])'),
        { a: 1 }
      );
    });
    it('returns an empty object when no keys match', function () {
      assert.deepStrictEqual(parser.evaluate('pick({a: 1}, ["z"])'), {});
    });
    it('returns undefined when the object is undefined', function () {
      assert.strictEqual(parser.evaluate('pick(undefined, ["a"])'), undefined);
    });
    it('throws when the first argument is not an object', function () {
      assert.throws(() => parser.evaluate('pick([1, 2], ["a"])'), /pick/);
    });
    it('throws when a key is not a string', function () {
      assert.throws(() => parser.evaluate('pick({a: 1}, [1])'), /pick/);
    });
  });

  describe('omit(obj, keys)', function () {
    it('drops the requested keys', function () {
      assert.deepStrictEqual(
        parser.evaluate('omit({a: 1, b: 2, c: 3}, ["b"])'),
        { a: 1, c: 3 }
      );
    });
    it('ignores keys not in the source', function () {
      assert.deepStrictEqual(
        parser.evaluate('omit({a: 1, b: 2}, ["z"])'),
        { a: 1, b: 2 }
      );
    });
    it('returns undefined when the object is undefined', function () {
      assert.strictEqual(parser.evaluate('omit(undefined, ["a"])'), undefined);
    });
    it('throws when the first argument is not an object', function () {
      assert.throws(() => parser.evaluate('omit([1, 2], ["a"])'), /omit/);
    });
  });
});
