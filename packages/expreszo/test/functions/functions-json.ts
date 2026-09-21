import assert from 'assert';
import { Parser } from '../../index';

const polluted = () => JSON.parse('{"__proto__": {"isAdmin": true}, "a": 1}');

describe('JSON Functions TypeScript Test', function () {
  describe('fromJson(text, fallback?)', function () {
    it('should parse objects, arrays, and scalars', function () {
      const parser = new Parser();
      assert.deepStrictEqual(parser.evaluate('fromJson(\'{"a": 1, "b": [2, 3]}\')'), { a: 1, b: [2, 3] });
      assert.deepStrictEqual(parser.evaluate('fromJson("[1, 2, 3]")'), [1, 2, 3]);
      assert.strictEqual(parser.evaluate('fromJson("42")'), 42);
      assert.strictEqual(parser.evaluate('fromJson(\'"hi"\')'), 'hi');
      assert.strictEqual(parser.evaluate('fromJson("true")'), true);
      assert.strictEqual(parser.evaluate('fromJson("null")'), null);
    });

    it('should allow member access on the result', function () {
      const parser = new Parser();
      const s = '{"lines": [{"qty": 1}, {"qty": 5}]}';
      assert.strictEqual(parser.evaluate('(fromJson(s)).lines[1].qty', { s }), 5);
      assert.strictEqual(parser.evaluate('o = fromJson(s); o.lines[1].qty', { s }), 5);
    });

    it('should round-trip with json()', function () {
      const parser = new Parser();
      assert.deepStrictEqual(parser.evaluate('fromJson(json({a: [1, {b: "x"}]}))'), { a: [1, { b: 'x' }] });
    });

    it('should return undefined for undefined input without a fallback', function () {
      const parser = new Parser();
      assert.strictEqual(parser.evaluate('fromJson(x)', { x: undefined }), undefined);
    });

    it('should throw on invalid JSON without a fallback', function () {
      const parser = new Parser();
      assert.throws(() => parser.evaluate('fromJson("{a: 1}")'), /fromJson\(\): invalid JSON/);
      assert.throws(() => parser.evaluate('fromJson("")'), /fromJson\(\): invalid JSON/);
    });

    it('should not echo the input in error messages', function () {
      const parser = new Parser();
      assert.throws(
        () => parser.evaluate('fromJson(s)', { s: 'secret-token-123' }),
        (err: Error) => !err.message.includes('secret')
      );
    });

    it('should throw on non-string input', function () {
      const parser = new Parser();
      assert.throws(() => parser.evaluate('fromJson(42)'), /expects a string/);
      assert.throws(() => parser.evaluate('fromJson(42, {})'), /expects a string/);
    });

    it('should return the fallback for invalid or undefined input', function () {
      const parser = new Parser();
      assert.deepStrictEqual(parser.evaluate('fromJson("not json", {theme: "light"})'), { theme: 'light' });
      assert.deepStrictEqual(parser.evaluate('fromJson(x, [])', { x: undefined }), []);
      assert.strictEqual(parser.evaluate('fromJson("not json", null)'), null);
    });

    it('should ignore the fallback for valid input', function () {
      const parser = new Parser();
      assert.deepStrictEqual(parser.evaluate('fromJson("[1]", "fallback")'), [1]);
    });

    it('should drop keys that expressions may not access', function () {
      const parser = new Parser();
      const result = parser.evaluate('fromJson(s)', {
        s: '{"__proto__": {"isAdmin": true}, "constructor": 1, "nested": {"prototype": 2, "ok": 3}, "a": 1}'
      }) as Record<string, unknown>;
      assert.deepStrictEqual(Object.keys(result), ['nested', 'a']);
      assert.deepStrictEqual(result.nested, { ok: 3 });
      assert.strictEqual(Object.getPrototypeOf(result), Object.prototype);
      assert.strictEqual(parser.evaluate('y = {...fromJson(s)}; y.isAdmin', { s: '{"__proto__": {"isAdmin": true}}' }), undefined);
    });

    it('should reject JSON nested beyond the depth limit', function () {
      const parser = new Parser();
      const deep = '['.repeat(257) + ']'.repeat(257);
      assert.throws(() => parser.evaluate('fromJson(s)', { s: deep }), /maximum nesting depth of 256/);
      assert.strictEqual(parser.evaluate('fromJson(s, "too deep")', { s: deep }), 'too deep');
      const ok = '['.repeat(256) + ']'.repeat(256);
      assert.ok(Array.isArray(parser.evaluate('fromJson(s)', { s: ok })));
    });

    it('should not count brackets inside strings towards the depth limit', function () {
      const parser = new Parser();
      const s = JSON.stringify({ text: '['.repeat(1000) + '\\"{' });
      assert.deepStrictEqual(parser.evaluate('fromJson(s)', { s }), { text: '['.repeat(1000) + '\\"{' });
    });

    it('should be constant-folded by simplify', function () {
      const parser = new Parser();
      const expr = parser.parse('fromJson("[1, 2]")').simplify();
      assert.deepStrictEqual(expr.evaluate(), [1, 2]);
    });
  });

  describe('toJson(value)', function () {
    it('should behave like json()', function () {
      const parser = new Parser();
      assert.strictEqual(parser.evaluate('toJson({a: [1, "x"]})'), '{"a":[1,"x"]}');
      assert.strictEqual(parser.evaluate('toJson("hi")'), '"hi"');
      assert.strictEqual(parser.evaluate('toJson(x)', { x: undefined }), undefined);
      assert.strictEqual(parser.evaluate('toJson(x) == json(x)', { x: { b: [true, null] } }), true);
    });

    it('should round-trip with fromJson()', function () {
      const parser = new Parser();
      assert.deepStrictEqual(parser.evaluate('fromJson(toJson({a: [1, {b: "x"}]}))'), { a: [1, { b: 'x' }] });
    });
  });

  describe('prototype injection via __proto__ keys', function () {
    it('should keep __proto__ inert in object spread', function () {
      const parser = new Parser();
      const result = parser.evaluate('{...x}', { x: polluted() }) as Record<string, unknown>;
      assert.strictEqual(Object.getPrototypeOf(result), Object.prototype);
      assert.strictEqual(parser.evaluate('y = {...x}; y.isAdmin', { x: polluted() }), undefined);
      assert.deepStrictEqual(Object.keys(result), ['__proto__', 'a']);
    });

    it('should keep __proto__ inert in async object spread', async function () {
      const parser = new Parser();
      (parser.functions as Record<string, unknown>).asyncId = async (v: unknown) => v;
      const result = await parser.parse('{...asyncId(x)}').evaluate({ x: polluted() }) as Record<string, unknown>;
      assert.strictEqual(Object.getPrototypeOf(result), Object.prototype);
      assert.strictEqual(result.isAdmin, undefined);
    });

    it('should keep __proto__ inert in merge, pick, omit, mapValues, and flatten', function () {
      const parser = new Parser();
      const exprs = [
        'merge({b: 2}, x)',
        'pick(x, ["__proto__", "a"])',
        'omit(x, ["a"])',
        'mapValues(x, v => v)',
        'flatten(x)'
      ];
      for (const e of exprs) {
        const result = parser.evaluate(e, { x: polluted() }) as Record<string, unknown>;
        assert.strictEqual(Object.getPrototypeOf(result), Object.prototype, e);
        assert.strictEqual(result.isAdmin, undefined, e);
      }
    });

    it('should keep __proto__ inert in groupBy and countBy', function () {
      const parser = new Parser();
      const grouped = parser.evaluate('groupBy(["__proto__", "a", "__proto__"], v => v)') as Record<string, unknown>;
      assert.strictEqual(Object.getPrototypeOf(grouped), Object.prototype);
      assert.deepStrictEqual(Object.getOwnPropertyDescriptor(grouped, '__proto__')?.value, ['__proto__', '__proto__']);
      const counted = parser.evaluate('countBy(["__proto__", "__proto__"], v => v)') as Record<string, unknown>;
      assert.strictEqual(Object.getPrototypeOf(counted), Object.prototype);
      assert.strictEqual(Object.getOwnPropertyDescriptor(counted, '__proto__')?.value, 2);
    });
  });
});
