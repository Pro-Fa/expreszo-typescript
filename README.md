<picture>
  <source media="(prefers-color-scheme: dark)" srcset="docs/logo_dark.png">
  <img src="docs/logo.png" alt="ExpresZo" width="420">
</picture>

# ExpresZo Typescript
[![npm](https://img.shields.io/npm/v/@pro-fa/expreszo.svg?maxAge=3600)](https://www.npmjs.com/package/@pro-fa/expreszo)
[![CI](https://github.com/Pro-Fa/expreszo-typescript/actions/workflows/ci.yml/badge.svg)](https://github.com/Pro-Fa/expreszo-typescript/actions/workflows/ci.yml)
[![codecov](https://codecov.io/gh/Pro-Fa/expreszo-typescript/branch/main/graph/badge.svg)](https://codecov.io/gh/Pro-Fa/expreszo-typescript)

**A fast, safe, and extensible expression evaluator for JavaScript and TypeScript.**

ExpresZo parses and evaluates expressions at runtime — a configurable alternative to `eval()` that won't execute arbitrary code. Use it to power user-facing formula editors, rule engines, template systems, or any place you need to evaluate dynamic expressions safely.

```js
import { Parser } from '@pro-fa/expreszo';

const parser = new Parser();
parser.evaluate('price * (1 - discount)', { price: 100, discount: 0.2 }); // 80
```

[Read full documentation](https://pro-fa.github.io/expreszo-typescript/docs/)

## Why ExpresZo?

### Fast

ExpresZo uses a **Pratt parser** — a top-down operator-precedence parsing algorithm that processes tokens in a single pass with no backtracking. Compared to the recursive-descent parser in the original expr-eval, this means:

- **Significantly faster parsing** — simple expressions parse in microseconds, complex ones at 40,000+ ops/sec
- **Predictable performance** — parsing time scales linearly with expression length, not exponentially with nesting depth
- **Better error messages** — the parser knows exactly what it expected at each position, producing precise diagnostics instead of generic "parse error" messages
- **Depth-limited** — a 256-level recursion cap prevents stack overflow from malicious or runaway input

Parsed expressions compile to an **immutable AST** that can be evaluated repeatedly against different variable sets with near-zero overhead.

### Safe

ExpresZo is designed to be safe by default:

- **No code execution** — expressions can only call explicitly registered functions, never arbitrary JavaScript
- **Prototype pollution protection** — access to `__proto__`, `prototype`, and `constructor` is blocked
- **Recursion depth limit** — deeply nested expressions are rejected at parse time
- **No `eval()` or `new Function()`** — the entire evaluation runs on a stack-based AST walker

### Extensible

Build exactly the parser you need:

```typescript
import { defineParser, coreParser, withMath, withString } from '@pro-fa/expreszo';

// Tree-shakeable: only include what you use
const parser = defineParser({
  operators: [...coreParser.operators, ...withMath.operators, ...withString.operators],
  functions: [...coreParser.functions, ...withMath.functions, ...withString.functions],
});
```

Or use the full kitchen-sink parser with zero configuration:

```typescript
const parser = new Parser(); // all built-in operators and functions included
```

## Installation

```bash
npm install @pro-fa/expreszo
```

## Quick Start

```typescript
import { Parser } from '@pro-fa/expreszo';

const parser = new Parser();

// Parse once, evaluate many times
const expr = parser.parse('2 * x + 1');
expr.evaluate({ x: 3 });  // 7
expr.evaluate({ x: 10 }); // 21

// Rich expression language
parser.evaluate('user.name ?? "Anonymous"', { user: {} }); // "Anonymous"
parser.evaluate('CASE WHEN score >= 90 THEN "A" WHEN score >= 80 THEN "B" ELSE "C" END', { score: 85 }); // "B"
```

## Key Features

| Category | Features |
|----------|----------|
| **Operators** | Arithmetic, comparison, logical, coalesce (`??`), ternary, assignment, member access |
| **Data types** | Numbers, strings, booleans, arrays, objects, `null`, `undefined` |
| **Functions** | 60+ built-in: math, string, array, object, type-checking, utility |
| **Custom functions** | Register your own JavaScript functions callable from expressions |
| **Arrow functions** | `x => x * 2`, `(a, b) => a + b` |
| **SQL CASE** | `CASE WHEN ... THEN ... ELSE ... END` multi-way conditionals |
| **Object construction** | `{ name: "Ada", score: x * 10 }` |
| **Async support** | Custom functions can return Promises; `evaluate()` auto-awaits |
| **Language service** | Completions, hover docs, diagnostics, syntax highlighting for IDE integration |
| **TypeScript** | Full type definitions, strict mode, no `any` leaks |
| **Tree-shakeable** | Subpath imports (`@pro-fa/expreszo/math`, `@pro-fa/expreszo/string`, ...) for minimal bundles |

## Playground

Try it live at the [Playground](https://pro-fa.github.io/expreszo-typescript/) — an interactive environment with code completions, syntax highlighting, and real-time evaluation.

## Documentation

### For Expression Writers

| Document | Description |
|:---------|:------------|
| [Quick Reference](docs/quick-reference.md) | Cheat sheet of operators, functions, and syntax |
| [Expression Syntax](docs/syntax.md) | Complete syntax reference with examples |

### For Developers

| Document | Description |
|:---------|:------------|
| [Parser](docs/parser.md) | Parser configuration, methods, and customization |
| [Expression](docs/expression.md) | Expression object methods: evaluate, simplify, variables |
| [Advanced Features](docs/advanced-features.md) | Promises, custom resolution, type conversion, operator customization |
| [Language Service](docs/language-service.md) | IDE integration: completions, hover info, diagnostics, Monaco Editor |
| [MCP Server](docs/mcp-server.md) | Model Context Protocol server exposing the language service to AI assistants |
| [Migration Guide](docs/migration.md) | Migrating from expr-eval, legacy mode, version history |

### For Contributors

| Document | Description |
|:---------|:------------|
| [Contributing](CONTRIBUTING.md) | Development setup, code style, and PR guidelines |
| [Performance Testing](docs/performance.md) | Benchmarks, profiling, and optimization guidance |
| [Breaking Changes](BREAKING_CHANGES.md) | Version-by-version breaking change documentation |

## Coming from expr-eval?

ExpresZo is a direct successor to [expr-eval](https://github.com/silentmatt/expr-eval). Existing expressions work out of the box. A `{ legacy: true }` option preserves older operator semantics while you migrate incrementally. See the [Migration Guide](docs/migration.md) for details.

## Origins

Originally based on [expr-eval 2.0.2](http://silentmatt.com/javascript-expression-evaluator/), completely rewritten with a Pratt parser, immutable AST, modular architecture, TypeScript, and comprehensive testing using Vitest.

## License

See [LICENSE.txt](LICENSE.txt) for license information.
