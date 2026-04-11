/**
 * Parity harness for the Phase 3 sync/async evaluator split. Every case
 * evaluates the same expression twice:
 *
 *   - Sync path: no async function in scope, so `async-analysis` returns
 *     false and `SyncEvaluator` produces the result synchronously.
 *   - Async path: the same expression is reparsed through a parser that
 *     has a native `async` function registered, which flips every `Call`
 *     through the async evaluator.
 *
 * The values must match. This exercises `AsyncEvaluator` over the same
 * node kinds the sync path covers, including `Ternary`, `Case`, `Member`,
 * `ArrayLit`, `ObjectLit`, `Lambda`, `FunctionDef`, `Sequence`, `Binary`
 * (`and`/`or`/`=`), and `Unary`.
 */
import { describe, it, expect } from 'vitest';
import { Parser } from '../../index.js';

/**
 * Native async wrapper. `constructor.name === 'AsyncFunction'` trips the
 * async-analysis visitor, so any expression containing `asyncId(...)`
 * routes through `AsyncEvaluator`.
 */
const asyncId = async <T>(value: T): Promise<T> => value;

function makeSyncParser(): Parser {
  return new Parser();
}

function makeAsyncParser(): Parser {
  const parser = new Parser();
  (parser.functions as Record<string, unknown>).asyncId = asyncId;
  return parser;
}

type Scope = Record<string, unknown>;

async function parity(
  expression: string,
  asyncExpression: string,
  scope: Scope = {}
): Promise<unknown> {
  const syncParser = makeSyncParser();
  const asyncParser = makeAsyncParser();
  const syncResult = syncParser.parse(expression).evaluate(scope);
  const asyncResult = await asyncParser.parse(asyncExpression).evaluate(scope);
  expect(asyncResult).toEqual(syncResult);
  return asyncResult;
}

describe('sync/async evaluator parity', () => {
  it('arithmetic and unary ops evaluate identically', async () => {
    await parity('1 + 2 * 3', 'asyncId(1) + asyncId(2) * asyncId(3)');
    await parity('-5 + 10', '-asyncId(5) + asyncId(10)');
    await parity('(1 + 2) * 3', '(asyncId(1) + asyncId(2)) * asyncId(3)');
  });

  it('logical and/or short-circuit on both paths', async () => {
    await parity('true and false', 'asyncId(true) and asyncId(false)');
    await parity('true or false', 'asyncId(true) or asyncId(false)');
    await parity('false and (1/0)', 'asyncId(false) and (1/0)');
    await parity('true or (1/0)', 'asyncId(true) or (1/0)');
  });

  it('ternary picks the right branch', async () => {
    await parity('1 > 0 ? "yes" : "no"', 'asyncId(1) > 0 ? asyncId("yes") : asyncId("no")');
    await parity('0 > 1 ? "yes" : "no"', 'asyncId(0) > 1 ? asyncId("yes") : asyncId("no")');
  });

  it('assignment and sequence', async () => {
    await parity('x = 5; x + 3', 'x = asyncId(5); x + asyncId(3)');
  });

  it('array and object literals', async () => {
    await parity('[1, 2, 3]', '[asyncId(1), asyncId(2), asyncId(3)]');
    await parity('{ a: 1, b: 2 }', '{ a: asyncId(1), b: asyncId(2) }');
    await parity('[1, 2][1]', '[asyncId(1), asyncId(2)][asyncId(1)]');
  });

  it('member access reachable from async path', async () => {
    // `obj.a` is member access on a sync parent, reached from the async
    // evaluator because the outer `+` has an asyncId operand.
    const parser = makeAsyncParser();
    const result = await parser.parse('obj.a + asyncId(0)').evaluate({ obj: { a: 42 } });
    expect(result).toBe(42);
  });

  it('function call with mixed sync and async arguments', async () => {
    await parity('max(1, 2, 3)', 'max(asyncId(1), asyncId(2), asyncId(3))');
    await parity('sum([1, 2, 3])', 'sum([asyncId(1), asyncId(2), asyncId(3)])');
  });

  it('user-defined function with async body', async () => {
    const parser = makeAsyncParser();
    const result = await parser.parse('double(x) = asyncId(x) * 2; double(5)').evaluate();
    expect(result).toBe(10);
  });

  it('lambda is exercised when invoked directly on the async path', async () => {
    // Built-ins like `map` are not promise-aware, so a lambda produced on
    // the async path can't flow through them. Invoking the lambda directly
    // from the expression still goes through `evalLambda` in the async
    // evaluator and is the right parity surface for lambda support.
    const parser = makeAsyncParser();
    const result = await parser.parse('(x => x * 2)(asyncId(21))').evaluate();
    expect(result).toBe(42);
  });

  it('case/when with async subject', async () => {
    const parser = makeAsyncParser();
    const source =
      'case asyncId(x) when 1 then "one" when 2 then "two" else "other" end';
    expect(await parser.parse(source).evaluate({ x: 1 })).toBe('one');
    expect(await parser.parse(source).evaluate({ x: 2 })).toBe('two');
    expect(await parser.parse(source).evaluate({ x: 3 })).toBe('other');
  });

  it('case/when without subject (search form)', async () => {
    const parser = makeAsyncParser();
    const source =
      'case when asyncId(x) > 5 then "big" when asyncId(x) > 0 then "small" else "zero" end';
    expect(await parser.parse(source).evaluate({ x: 10 })).toBe('big');
    expect(await parser.parse(source).evaluate({ x: 3 })).toBe('small');
    expect(await parser.parse(source).evaluate({ x: 0 })).toBe('zero');
  });

  it('nested async calls propagate', async () => {
    const parser = makeAsyncParser();
    const result = await parser.parse('asyncId(asyncId(asyncId(42)))').evaluate();
    expect(result).toBe(42);
  });
});

describe('sync evaluator fallback to async', () => {
  it('upgrades to async when an unexpected thenable shows up', async () => {
    const parser = new Parser();
    // Non-native promise-returning function, registered directly — the
    // constructor check does NOT flag this as async, so the sync path is
    // taken first and then falls back when it sees the thenable.
    (parser.functions as Record<string, unknown>).slowDouble = (value: number) =>
      new Promise((resolve) => setTimeout(() => resolve(value * 2), 5));
    const expr = parser.parse('slowDouble(21) + 1');
    const result = await (expr.evaluate() as Promise<number>);
    expect(result).toBe(43);
  });

  it('caches the async upgrade so subsequent evaluate() calls take the async path directly', async () => {
    const parser = new Parser();
    let calls = 0;
    (parser.functions as Record<string, unknown>).tick = () => {
      calls++;
      return Promise.resolve(calls);
    };
    const expr = parser.parse('tick() + tick()');
    // First call: detects thenable, caches async, returns promise.
    const first = await (expr.evaluate() as Promise<number>);
    const callsAfterFirst = calls;
    // Second call: should route straight to async without a sync retry.
    const second = await (expr.evaluate() as Promise<number>);
    expect(first).toBeGreaterThan(0);
    expect(second).toBeGreaterThan(first);
    // If the sync path was re-tried, `calls` would jump by more than 2
    // between the two invocations (the sync attempt + the async retry).
    expect(calls - callsAfterFirst).toBe(2);
  });
});
