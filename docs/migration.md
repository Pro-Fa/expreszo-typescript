# Migration Guide

> **Audience:** Developers upgrading from the original `expr-eval` library or previous versions.

This guide helps you migrate to the current version of `@pro-fa/expreszo`.

## Migrating from silentmatt/expr-eval

This library is a TypeScript port of the original [expr-eval](https://github.com/silentmatt/expr-eval) library. Most expressions will work without changes, but there are some differences to be aware of.

### What's the Same

- Core expression syntax (arithmetic, comparison, logical operators)
- Built-in math functions (sin, cos, sqrt, etc.)
- Expression methods (evaluate, simplify, variables, toJSFunction)
- Parser configuration for enabling/disabling operators

### What's New

| Feature | Description |
|---------|-------------|
| `undefined` keyword | Use `undefined` in expressions |
| Coalesce operator (`??`) | Null/undefined fallback |
| Optional chaining | Property access returns `undefined` instead of errors |
| `not in` operator | Check if value is not in array |
| SQL CASE blocks | Multi-way conditionals |
| Object construction | Create objects with `{key: value}` |
| Arrow functions | `x => x * 2` syntax |
| Promise support | Async custom functions |
| String concatenation with `+` | `"a" + "b"` works |
| Language service | IDE integration (completions, hover, diagnostics) |

### Behavior Changes

#### Undefined Handling

The original library would throw errors for undefined values. This version handles them gracefully:

```js
// Original: throws error
// New: returns undefined
parser.evaluate('x + 1', { x: undefined }); // undefined

// Use coalesce for fallback
parser.evaluate('x ?? 0 + 1', { x: undefined }); // 1
```

#### Property Access

Missing properties now return `undefined` instead of throwing:

```js
const obj = { user: { name: 'Ada' } };

// Original: throws error
// New: returns undefined
parser.evaluate('user.email', obj); // undefined
parser.evaluate('user.profile.photo', obj); // undefined
```

## Migrating Between Major Versions

### Version 7.0.0

v7 replaces the stack-based bytecode interpreter with an AST-based architecture, adds a Pratt parser, and introduces descriptor-driven parser composition. Most expression syntax and the core `Parser`/`Expression` API are unchanged.

**`Expression.toJSFunction()` removed:**

```typescript
// BEFORE (v6)
const fn = parser.parse('x + y').toJSFunction('x, y');
fn(2, 3); // 5

// AFTER (v7) — wrap evaluate() in a closure
const expr = parser.parse('x + y');
const fn = (x: number, y: number) => expr.evaluate({ x, y });
fn(2, 3); // 5
```

**`Expression.tokens` removed:**

The internal instruction array is replaced by a private AST. Use the visitor pattern:

```typescript
// BEFORE (v6)
expr.tokens.forEach(t => console.log(t));

// AFTER (v7)
import type { NodeVisitor } from '@pro-fa/expreszo/core';
expr.accept(myVisitor);
```

**Static `Parser.parse()` / `Parser.evaluate()` removed:**

```typescript
// BEFORE (v6)
Parser.parse('x + 1');
Parser.evaluate('x + 1', { x: 4 });

// AFTER (v7)
const parser = new Parser();
parser.parse('x + 1');
parser.evaluate('x + 1', { x: 4 });
```

**Parser recursion depth limit:**

Expressions nested deeper than 256 levels now throw `ParseError`. This prevents stack overflow DoS attacks. Normal expressions are not affected.

**New: tree-shakeable parser composition (optional):**

v7 introduces `defineParser()` and composable presets. The default `new Parser()` still includes all built-in operators and functions (equivalent to `fullParser`), so no migration is needed. But you can now create minimal parsers:

```typescript
import { defineParser, coreParser, withMath, withComparison } from '@pro-fa/expreszo';

const parser = defineParser({
  ...coreParser,
  operators: [...coreParser.operators, ...withMath.operators, ...withComparison.operators],
  functions: [...coreParser.functions, ...withMath.functions, ...withComparison.functions],
});
```

Or use subpath imports for smaller bundles:

```typescript
import { coreParser } from '@pro-fa/expreszo/core';
import { withMath } from '@pro-fa/expreszo/math';
```

**Migration steps:**

1. Search for `toJSFunction` — replace with closures over `evaluate()`
2. Search for `Expression.tokens` or `Instruction` — migrate to visitor pattern
3. Search for `Parser.parse(` or `Parser.evaluate(` (static calls) — create an instance
4. Test deeply nested expressions (unlikely to be affected unless programmatically generated)

### Version 6.0.0

**`null` comparison changed:**

```js
// Before 6.0: null was cast to 0
null == 0  // true (before)
null == 0  // false (after)

// Now null equals null
null == someNullVariable  // true (after)
```

### Version 5.0.0

**Critical security change: Functions must be registered explicitly.**

This addresses several security vulnerabilities (CVE-2025-12735, CVE-2025-13204).

```js
// BEFORE (vulnerable, no longer works)
parser.evaluate('customFunc()', { customFunc: () => 'result' });
parser.evaluate('obj.method()', { obj: { method: () => 'danger' } });

// AFTER (secure)
parser.functions.customFunc = () => 'result';
parser.evaluate('customFunc()');
```

**What still works:**
- Passing primitive values via context
- Passing objects with non-function properties
- Built-in functions
- Inline function definitions: `(f(x) = x * 2)(5)`
- Functions registered in `parser.functions`

**Migration steps:**

1. Search your code for `evaluate('...', { fn: ... })` patterns where `fn` is a function
2. Move those functions to `parser.functions`:

```js
// Before
const myFunc = (x) => x * 2;
parser.evaluate('myFunc(5)', { myFunc });

// After
parser.functions.myFunc = (x) => x * 2;
parser.evaluate('myFunc(5)');
```

**Protected properties:**

Access to these properties is now blocked:
- `__proto__`
- `prototype`
- `constructor`

### Version 4.0.0

**Concatenation operator changed from `||` to `|`:**

The `||` operator was repurposed for logical OR (JavaScript-style), and a new `|` operator was introduced for concatenation.

```js
// BEFORE (original expr-eval 2.x)
"hello" || " world"     // "hello world" (concatenation)
[1, 2] || [3, 4]        // [1, 2, 3, 4] (concatenation)
true || false           // Not supported or different behavior

// AFTER (v4.0.0+)
"hello" | " world"      // "hello world" (concatenation with |)
[1, 2] | [3, 4]         // [1, 2, 3, 4] (concatenation with |)
true || false           // true (logical OR)
true && false           // false (logical AND)
```

**Migration steps:**

1. Search your expressions for `||` used for string or array concatenation
2. Replace `||` with `|` for concatenation operations
3. `||` now works as logical OR, and `&&` was added as logical AND

**Package renamed:**

The package was renamed from `expr-eval` to `@pro-fa/expreszo` and ported to TypeScript.

## Package Name Change

If you're migrating from the original package:

```bash
# Remove old package
npm uninstall expr-eval

# Install new package
npm install @pro-fa/expreszo
```

Update imports:

```js
// Before
const { Parser } = require('expr-eval');

// After
import { Parser } from '@pro-fa/expreszo';
// or
const { Parser } = require('@pro-fa/expreszo');
```

## TypeScript Support

This version includes full TypeScript type definitions. If you were using `@types/expr-eval`, you can remove it:

```bash
npm uninstall @types/expr-eval
```

Types are exported from the main package:

```typescript
import { Parser, Expression, Value, Values } from '@pro-fa/expreszo';
```

## Getting Help

If you encounter issues during migration:

1. Check the [Breaking Changes](breaking-changes.md) for detailed breaking change information
2. Review the documentation for the feature you're using
3. Open an issue on GitHub with a minimal reproduction case
