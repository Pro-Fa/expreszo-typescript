import { describe, it } from 'vitest';
import { Parser, Value } from '../../index.js';

// Setup
const parser = new Parser();

// Helper function for floating-point comparisons with delta
function assertCloseTo(actual: Value | Promise<Value>, expected: number, delta: number = 1e-14): void {
  if (actual instanceof Promise) {
    throw new Error('assertCloseTo does not support Promise values');
  }

  if (typeof actual !== 'number' || typeof expected !== 'number') {
    throw new Error(`Both actual and expected values must be numbers. Got actual: ${actual}, expected: ${expected}`);
  }

  const diff = Math.abs(actual - expected);
  if (diff > delta) {
    throw new Error(`Expected ${expected} ± ${delta}, but got ${actual} (diff: ${diff})`);
  }
}

function isNaN(value: Value | Promise<Value>): boolean {
  return Number.isNaN(value);
}

describe('sqrt(x)', () => {
  it('returns the square root of its argument', () => {
    const delta = 1e-15;
    strictEqual(parser.evaluate('sqrt 0'), 0);
    assertCloseTo(parser.evaluate('sqrt 0.5'), 0.7071067811865476, delta);
    strictEqual(parser.evaluate('sqrt 1'), 1);
    assertCloseTo(parser.evaluate('sqrt 2'), 1.4142135623730951, delta);
    strictEqual(parser.evaluate('sqrt 4'), 2);
    assertCloseTo(parser.evaluate('sqrt 8'), 2.8284271247461903, delta);
    strictEqual(parser.evaluate('sqrt 16'), 4);
    strictEqual(parser.evaluate('sqrt 81'), 9);
    strictEqual(parser.evaluate('sqrt 100'), 10);
    strictEqual(parser.evaluate('sqrt 1000'), 31.622776601683793);
    ok(isNaN(parser.evaluate('sqrt -1')));
  });
});

describe('ln/log operator', () => {
  it('returns the natural logarithm of its argument', () => {
    const delta = 1e-15;
    strictEqual(parser.evaluate('ln 0'), -Infinity);
    strictEqual(parser.evaluate('log 0'), -Infinity);
    assertCloseTo(parser.evaluate('ln 0.5'), -0.6931471805599453, delta);
    assertCloseTo(parser.evaluate('log 0.5'), -0.6931471805599453, delta);
    strictEqual(parser.evaluate('ln 1'), 0);
    strictEqual(parser.evaluate('log 1'), 0);
    assertCloseTo(parser.evaluate('ln 2'), 0.6931471805599453, delta);
    assertCloseTo(parser.evaluate('log 2'), 0.6931471805599453, delta);
    strictEqual(parser.evaluate('ln E'), 1);
    strictEqual(parser.evaluate('log E'), 1);
    assertCloseTo(parser.evaluate('ln PI'), 1.1447298858494002, delta);
    assertCloseTo(parser.evaluate('log PI'), 1.1447298858494002, delta);
    assertCloseTo(parser.evaluate('ln 10'), 2.302585092994046, delta);
    assertCloseTo(parser.evaluate('log 10'), 2.302585092994046, delta);
    assertCloseTo(parser.evaluate('ln 100'), 4.605170185988092, delta);
    ok(isNaN(parser.evaluate('ln -1')));
    ok(isNaN(parser.evaluate('log -1')));
  });
});

describe('log10 operator', () => {
  it('returns the base-10 logarithm of its argument', () => {
    const delta = 1e-15;
    strictEqual(parser.evaluate('log10 0'), -Infinity);
    strictEqual(parser.evaluate('lg 0'), -Infinity);
    assertCloseTo(parser.evaluate('log10 0.5'), -0.3010299956639812, delta);
    assertCloseTo(parser.evaluate('lg 0.5'), -0.3010299956639812, delta);
    strictEqual(parser.evaluate('log10 1'), 0);
    strictEqual(parser.evaluate('lg 1'), 0);
    assertCloseTo(parser.evaluate('log10 2'), 0.3010299956639812, delta);
    assertCloseTo(parser.evaluate('lg 2'), 0.3010299956639812, delta);
    assertCloseTo(parser.evaluate('log10 E'), 0.4342944819032518, delta);
    assertCloseTo(parser.evaluate('lg E'), 0.4342944819032518, delta);
    assertCloseTo(parser.evaluate('log10 PI'), 0.49714987269413385, delta);
    assertCloseTo(parser.evaluate('lg PI'), 0.49714987269413385, delta);
    strictEqual(parser.evaluate('log10 10'), 1);
    strictEqual(parser.evaluate('lg 10'), 1);
    strictEqual(parser.evaluate('log10 100'), 2);
    strictEqual(parser.evaluate('lg 100'), 2);
    strictEqual(parser.evaluate('log10 1000'), 3);
    strictEqual(parser.evaluate('lg 1000'), 3);
    strictEqual(parser.evaluate('log10 10000000000'), 10);
    strictEqual(parser.evaluate('lg 10000000000'), 10);
    ok(isNaN(parser.evaluate('log10 -1')));
    ok(isNaN(parser.evaluate('lg -1')));
  });
});

describe('abs(x)', () => {
  it('returns the correct value', () => {
    strictEqual(parser.evaluate('abs 0'), 0);
    strictEqual(parser.evaluate('abs 0.5'), 0.5);
    strictEqual(parser.evaluate('abs -0.5'), 0.5);
    strictEqual(parser.evaluate('abs 1'), 1);
    strictEqual(parser.evaluate('abs -1'), 1);
    strictEqual(parser.evaluate('abs 2'), 2);
    strictEqual(parser.evaluate('abs -2'), 2);
    strictEqual(parser.evaluate('abs(-Infinity)'), Infinity);
  });
});

describe('ceil(x)', () => {
  it('rounds up to the nearest integer', () => {
    strictEqual(parser.evaluate('ceil 0'), 0);
    strictEqual(parser.evaluate('ceil 0.5'), 1);
    strictEqual(parser.evaluate('ceil -0.5'), 0);
    strictEqual(parser.evaluate('ceil 1'), 1);
    strictEqual(parser.evaluate('ceil -1'), -1);
    strictEqual(parser.evaluate('ceil 1.000001'), 2);
    strictEqual(parser.evaluate('ceil -1.000001'), -1);
    strictEqual(parser.evaluate('ceil 2.999'), 3);
    strictEqual(parser.evaluate('ceil -2.999'), -2);
    strictEqual(parser.evaluate('ceil 123.5'), 124);
    strictEqual(parser.evaluate('ceil -123.5'), -123);
    strictEqual(parser.evaluate('ceil(Infinity)'), Infinity);
    strictEqual(parser.evaluate('ceil(-Infinity)'), -Infinity);
  });
});

describe('floor(x)', () => {
  it('rounds down to the nearest integer', () => {
    strictEqual(parser.evaluate('floor 0'), 0);
    strictEqual(parser.evaluate('floor 0.5'), 0);
    strictEqual(parser.evaluate('floor -0.5'), -1);
    strictEqual(parser.evaluate('floor 1'), 1);
    strictEqual(parser.evaluate('floor -1'), -1);
    strictEqual(parser.evaluate('floor 1.000001'), 1);
    strictEqual(parser.evaluate('floor -1.000001'), -2);
    strictEqual(parser.evaluate('floor 2.999'), 2);
    strictEqual(parser.evaluate('floor -2.999'), -3);
    strictEqual(parser.evaluate('floor 123.5'), 123);
    strictEqual(parser.evaluate('floor -123.5'), -124);
    strictEqual(parser.evaluate('floor(Infinity)'), Infinity);
    strictEqual(parser.evaluate('floor(-Infinity)'), -Infinity);
  });
});

describe('round(x)', () => {
  it('rounds to the nearest integer', () => {
    strictEqual(parser.evaluate('round 0'), 0);
    strictEqual(parser.evaluate('round 0.4999'), 0);
    strictEqual(parser.evaluate('round -0.4999'), 0);
    strictEqual(parser.evaluate('round 0.5'), 1);
    strictEqual(parser.evaluate('round -0.5'), 0);
    strictEqual(parser.evaluate('round 0.5001'), 1);
    strictEqual(parser.evaluate('round -0.5001'), -1);
    strictEqual(parser.evaluate('round 1'), 1);
    strictEqual(parser.evaluate('round -1'), -1);
    strictEqual(parser.evaluate('round 1.000001'), 1);
    strictEqual(parser.evaluate('round -1.000001'), -1);
    strictEqual(parser.evaluate('round 1.5'), 2);
    strictEqual(parser.evaluate('round -1.5'), -1);
    strictEqual(parser.evaluate('round 2.999'), 3);
    strictEqual(parser.evaluate('round -2.999'), -3);
    strictEqual(parser.evaluate('round 2.5'), 3);
    strictEqual(parser.evaluate('round -2.5'), -2);
    strictEqual(parser.evaluate('round 123.5'), 124);
    strictEqual(parser.evaluate('round -123.5'), -123);
    strictEqual(parser.evaluate('round(Infinity)'), Infinity);
    strictEqual(parser.evaluate('round(-Infinity)'), -Infinity);
  });
});

describe('trunc(x)', () => {
  it('rounds toward zero', () => {
    strictEqual(parser.evaluate('trunc 0'), 0);
    strictEqual(parser.evaluate('trunc 0.4999'), 0);
    strictEqual(parser.evaluate('trunc -0.4999'), 0);
    strictEqual(parser.evaluate('trunc 0.5'), 0);
    strictEqual(parser.evaluate('trunc -0.5'), 0);
    strictEqual(parser.evaluate('trunc 0.5001'), 0);
    strictEqual(parser.evaluate('trunc -0.5001'), 0);
    strictEqual(parser.evaluate('trunc 1'), 1);
    strictEqual(parser.evaluate('trunc -1'), -1);
    strictEqual(parser.evaluate('trunc 1.000001'), 1);
    strictEqual(parser.evaluate('trunc -1.000001'), -1);
    strictEqual(parser.evaluate('trunc 1.5'), 1);
    strictEqual(parser.evaluate('trunc -1.5'), -1);
    strictEqual(parser.evaluate('trunc 2.999'), 2);
    strictEqual(parser.evaluate('trunc -2.999'), -2);
    strictEqual(parser.evaluate('trunc 2.5'), 2);
    strictEqual(parser.evaluate('trunc -2.5'), -2);
    strictEqual(parser.evaluate('trunc 123.5'), 123);
    strictEqual(parser.evaluate('trunc -123.5'), -123);
    strictEqual(parser.evaluate('trunc(Infinity)'), Infinity);
    strictEqual(parser.evaluate('trunc(-Infinity)'), -Infinity);
  });
});

describe('exp(x)', () => {
  it('rounds to the nearest integer', () => {
    const delta = 1e-15;
    strictEqual(parser.evaluate('exp 0'), 1);
    assertCloseTo(parser.evaluate('exp 0.5'), 1.6487212707001282, delta);
    assertCloseTo(parser.evaluate('exp -0.5'), 0.6065306597126334, delta);
    assertCloseTo(parser.evaluate('exp 1'), 2.718281828459045, delta);
    assertCloseTo(parser.evaluate('exp -1'), 0.36787944117144233, delta);
    assertCloseTo(parser.evaluate('exp 1.5'), 4.4816890703380645, delta);
    assertCloseTo(parser.evaluate('exp -1.5'), 0.22313016014842982, delta);
    assertCloseTo(parser.evaluate('exp 2'), 7.3890560989306495, delta);
    assertCloseTo(parser.evaluate('exp -2'), 0.1353352832366127, delta);
    assertCloseTo(parser.evaluate('exp 2.5'), 12.182493960703471, delta * 10);
    assertCloseTo(parser.evaluate('exp -2.5'), 0.0820849986238988, delta);
    assertCloseTo(parser.evaluate('exp 3'), 20.085536923187668, delta);
    assertCloseTo(parser.evaluate('exp 4'), 54.59815003314423, delta * 10);
    assertCloseTo(parser.evaluate('exp 10'), 22026.46579480671, delta * 10000);
    assertCloseTo(parser.evaluate('exp -10'), 0.00004539992976248486, delta);
    strictEqual(parser.evaluate('exp(Infinity)'), Infinity);
    strictEqual(parser.evaluate('exp(-Infinity)'), 0);
  });
});

describe('sign(x)', () => {
  it('returns the sign of x', () => {
    strictEqual(parser.evaluate('sign 0'), 0);
    strictEqual(parser.evaluate('sign 1'), 1);
    strictEqual(parser.evaluate('sign -1'), -1);
    strictEqual(parser.evaluate('sign 2'), 1);
    strictEqual(parser.evaluate('sign -2'), -1);
    strictEqual(parser.evaluate('sign 0.001'), 1);
    strictEqual(parser.evaluate('sign -0.001'), -1);

    strictEqual(parser.parse('sign -0.001').simplify().toString(), '(-1)');

    strictEqual(parser.parse('sign x').evaluate({ x: 0 }), 0);
    strictEqual(parser.parse('sign x').evaluate({ x: 2 }), 1);
    strictEqual(parser.parse('sign x').evaluate({ x: -2 }), -1);
  });
});

describe('cbrt(x)', () => {
  it('returns the cube root of x', () => {
    const delta = 1e-15;

    ok(isNaN(parser.evaluate('cbrt(NaN)')));
    strictEqual(parser.evaluate('cbrt -1'), -1);
    strictEqual(parser.evaluate('cbrt 0'), 0);
    strictEqual(parser.evaluate('cbrt(-Infinity)'), -Infinity);
    strictEqual(parser.evaluate('cbrt 1'), 1);
    strictEqual(parser.evaluate('cbrt(Infinity)'), Infinity);
    assertCloseTo(parser.evaluate('cbrt 2'), 1.2599210498948732, delta);
    assertCloseTo(parser.evaluate('cbrt -2'), -1.2599210498948732, delta);
    strictEqual(parser.evaluate('cbrt 8'), 2);
    strictEqual(parser.evaluate('cbrt 27'), 3);
    strictEqual(parser.evaluate('cbrt -8'), -2);
    strictEqual(parser.evaluate('cbrt -27'), -3);

    strictEqual(parser.parse('cbrt 8').simplify().toString(), '2');

    strictEqual(parser.parse('cbrt x').evaluate({ x: 27 }), 3);
  });
});

describe('expm1(x)', () => {
  it('returns e^x - 1', () => {
    const delta = 1e-15;

    ok(isNaN(parser.evaluate('expm1(NaN)')));
    assertCloseTo(parser.evaluate('expm1 -1'), -0.6321205588285577, delta);
    strictEqual(parser.evaluate('expm1 0'), 0);
    assertCloseTo(parser.evaluate('expm1 1'), 1.718281828459045, delta);
    assertCloseTo(parser.evaluate('expm1 2'), 6.38905609893065, delta);

    ok(/^1.718281828459\d*$/.test(parser.parse('expm1 1').simplify().toString()));

    assertCloseTo(parser.parse('expm1 x').evaluate({ x: 1 }) as number, 1.718281828459045, delta);
    assertCloseTo(parser.parse('expm1 x').evaluate({ x: 2 }) as number, 6.38905609893065, delta);
  });
});

describe('log1p(x)', () => {
  it('returns log(1 + x)', () => {
    const delta = 1e-15;

    ok(isNaN(parser.evaluate('log1p(NaN)')));
    strictEqual(parser.evaluate('log1p -1'), -1 / 0);
    strictEqual(parser.evaluate('log1p 0'), 0);
    assertCloseTo(parser.evaluate('log1p 1'), 0.6931471805599453, delta);
    ok(isNaN(parser.evaluate('log1p -2')));
    assertCloseTo(parser.evaluate('log1p 9'), 2.302585092994046, delta);

    assertCloseTo(parser.parse('log1p x').evaluate({ x: 1 }) as number, 0.6931471805599453, delta);
    assertCloseTo(parser.parse('log1p x').evaluate({ x: 9 }) as number, 2.302585092994046, delta);
  });
});

describe('log2(x)', () => {
  it('returns the base 2 log of x', () => {
    const delta = 1e-15;

    ok(isNaN(parser.evaluate('log2(NaN)')));
    ok(isNaN(parser.evaluate('log2 -1')));
    strictEqual(parser.evaluate('log2 0'), -1 / 0);
    strictEqual(parser.evaluate('log2 1'), 0);
    strictEqual(parser.evaluate('log2 2'), 1);
    strictEqual(parser.evaluate('log2 3'), 1.584962500721156);
    strictEqual(parser.evaluate('log2 4'), 2);
    strictEqual(parser.evaluate('log2 8'), 3);
    strictEqual(parser.evaluate('log2 1024'), 10);

    strictEqual(parser.parse('log2 x').evaluate({ x: 4 }), 2);
    assertCloseTo(parser.parse('log2 x').evaluate({ x: 3 }) as number, 1.584962500721156, delta);
  });
});

// Helper functions for assertions
function strictEqual<T>(actual: T, expected: T): void {
  if (actual !== expected) {
    throw new Error(`Expected ${expected}, but got ${actual}`);
  }
}

function ok(value: any): void {
  if (!value) {
    throw new Error(`Expected truthy value, but got ${value}`);
  }
}
