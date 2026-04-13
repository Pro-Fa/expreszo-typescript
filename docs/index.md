# ExpresZo Typescript

[![npm](https://img.shields.io/npm/v/@pro-fa/expreszo.svg?maxAge=3600)](https://www.npmjs.com/package/@pro-fa/expreszo)

**A fast, safe, and extensible expression evaluator for JavaScript and TypeScript.**

ExpresZo parses and evaluates expressions at runtime — a configurable alternative to `eval()` that won't execute arbitrary code. Use it to power user-facing formula editors, rule engines, template systems, or any place you need to evaluate dynamic expressions safely.

## Why ExpresZo?

### Fast

ExpresZo uses a **Pratt parser** — a top-down operator-precedence parsing algorithm that processes tokens in a single pass with no backtracking. Compared to the recursive-descent parser in the original expr-eval, this means significantly faster parsing, predictable linear performance scaling, and better error messages with precise diagnostics.

Parsed expressions compile to an **immutable AST** that can be evaluated repeatedly against different variable sets with near-zero overhead.

### Safe

- **No code execution** — expressions can only call explicitly registered functions
- **Prototype pollution protection** — access to `__proto__`, `prototype`, and `constructor` is blocked
- **Recursion depth limit** — deeply nested expressions are rejected at parse time
- **No `eval()` or `new Function()`** — evaluation runs on a stack-based AST walker

### Extensible

Build exactly the parser you need with tree-shakeable presets, or use the full kitchen-sink parser with zero configuration.

## Installation

```bash
npm install @pro-fa/expreszo
```

## Quick Start

```typescript
import { Parser } from '@pro-fa/expreszo';

const parser = new Parser();
const expr = parser.parse('2 * x + 1');
console.log(expr.evaluate({ x: 3 })); // 7
```

## Documentation

### For Expression Writers

- [Quick Reference](quick-reference.md) - Cheat sheet of operators, functions, and syntax
- [Expression Syntax](syntax.md) - Complete syntax reference with examples

### For Developers

- [Parser](parser.md) - Parser configuration, methods, and customization
- [Expression](expression.md) - Expression object methods: evaluate, simplify, variables
- [Advanced Features](advanced-features.md) - Promises, custom resolution, type conversion, operator customization
- [Language Service](language-service.md) - IDE integration: completions, hover info, diagnostics, Monaco Editor
- [Migration Guide](migration.md) - Migrating from expr-eval, legacy mode, version history

### For Contributors

- [Contributing](contributing.md) - Development setup, code style, and PR guidelines
- [Performance Testing](performance.md) - Benchmarks, profiling, and optimization guidance
- [Breaking Changes](breaking-changes.md) - Version-by-version breaking change documentation

## Playground

Try it live at the [Playground](https://pro-fa.github.io/expreszo-typescript/) — an interactive environment with code completions, syntax highlighting, and real-time evaluation.

## License

See [LICENSE.txt](https://github.com/pro-fa/expreszo-typescript/blob/main/LICENSE.txt) for license information.
