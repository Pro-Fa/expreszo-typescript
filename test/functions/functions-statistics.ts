/* global describe, it */

import assert from 'assert';
import { Parser } from '../../index';

describe('Statistics Functions', function () {
  const parser = new Parser();

  describe('mean(array)', function () {
    it('computes the arithmetic mean', function () {
      assert.strictEqual(parser.evaluate('mean([1, 2, 3, 4, 5])'), 3);
      assert.strictEqual(parser.evaluate('mean([10, 20, 30])'), 20);
    });
    it('returns undefined for an empty array', function () {
      assert.strictEqual(parser.evaluate('mean([])'), undefined);
    });
    it('propagates undefined inputs', function () {
      assert.strictEqual(parser.evaluate('mean(undefined)'), undefined);
    });
    it('throws on non-numeric elements', function () {
      assert.throws(() => parser.evaluate('mean([1, "x", 3])'), /mean/);
    });
  });

  describe('median(array)', function () {
    it('returns the middle value for odd lengths', function () {
      assert.strictEqual(parser.evaluate('median([1, 2, 3, 4, 5])'), 3);
    });
    it('averages the two middle values for even lengths', function () {
      assert.strictEqual(parser.evaluate('median([1, 2, 3, 4])'), 2.5);
    });
    it('does not assume the array is pre-sorted', function () {
      assert.strictEqual(parser.evaluate('median([5, 1, 3, 2, 4])'), 3);
    });
    it('returns undefined for an empty array', function () {
      assert.strictEqual(parser.evaluate('median([])'), undefined);
    });
  });

  describe('mostFrequent(array)', function () {
    it('returns the most common number', function () {
      assert.strictEqual(parser.evaluate('mostFrequent([1, 2, 2, 3, 3, 3])'), 3);
    });
    it('works with strings', function () {
      assert.strictEqual(parser.evaluate('mostFrequent(["a", "b", "a"])'), 'a');
    });
    it('returns the first-seen value on ties', function () {
      assert.strictEqual(parser.evaluate('mostFrequent([1, 2, 3])'), 1);
    });
    it('returns undefined for an empty array', function () {
      assert.strictEqual(parser.evaluate('mostFrequent([])'), undefined);
    });
  });

  describe('variance(array)', function () {
    it('computes population variance', function () {
      assert.strictEqual(parser.evaluate('variance([2, 4, 4, 4, 5, 5, 7, 9])'), 4);
    });
    it('returns 0 for a constant array', function () {
      assert.strictEqual(parser.evaluate('variance([5, 5, 5, 5])'), 0);
    });
    it('returns undefined for an empty array', function () {
      assert.strictEqual(parser.evaluate('variance([])'), undefined);
    });
  });

  describe('stddev(array)', function () {
    it('is the square root of variance', function () {
      assert.strictEqual(parser.evaluate('stddev([2, 4, 4, 4, 5, 5, 7, 9])'), 2);
    });
    it('returns 0 for a constant array', function () {
      assert.strictEqual(parser.evaluate('stddev([10, 10, 10])'), 0);
    });
    it('returns undefined for an empty array', function () {
      assert.strictEqual(parser.evaluate('stddev([])'), undefined);
    });
  });

  describe('percentile(array, p)', function () {
    it('matches the median at p=50', function () {
      assert.strictEqual(parser.evaluate('percentile([1,2,3,4,5,6,7,8,9,10], 50)'), 5.5);
    });
    it('interpolates between ranks', function () {
      assert.strictEqual(parser.evaluate('percentile([1,2,3,4,5,6,7,8,9,10], 90)'), 9.1);
    });
    it('returns the minimum at p=0 and maximum at p=100', function () {
      assert.strictEqual(parser.evaluate('percentile([1,2,3,4,5,6,7,8,9,10], 0)'), 1);
      assert.strictEqual(parser.evaluate('percentile([1,2,3,4,5,6,7,8,9,10], 100)'), 10);
    });
    it('returns the single value for a one-element array', function () {
      assert.strictEqual(parser.evaluate('percentile([7], 25)'), 7);
    });
    it('throws on out-of-range p', function () {
      assert.throws(() => parser.evaluate('percentile([1,2,3], 150)'), /percentile/);
      assert.throws(() => parser.evaluate('percentile([1,2,3], -1)'), /percentile/);
    });
  });
});
