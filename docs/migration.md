# Migration Guide

> **Audience:** Developers migrating from `expr-eval` or `@pro-fa/expr-eval`, or upgrading between ExpresZo versions.

## Migrating from expr-eval

ExpresZo Typescript is a direct continuation of the `@pro-fa/expr-eval` package — a complete TypeScript rewrite of the original [expr-eval](https://github.com/silentmatt/expr-eval) library. Most expressions work without changes. This section walks you through the package swap and explains the **legacy mode** option for preserving older behavior during the transition.

### Step 1: Swap the Package

```bash
# Remove the old package
npm uninstall expr-eval          # if you used the original silentmatt package
npm uninstall @pro-fa/expr-eval  # if you used the Pro-Fa fork

# Install ExpresZo
npm install @pro-fa/expreszo
```

If you had the community TypeScript types installed, remove them too — ExpresZo ships its own declarations:

```bash
npm uninstall @types/expr-eval
```

### Step 2: Update Imports

Find and replace across your codebase:

```typescript
// Before
import { Parser } from 'expr-eval';
import { Parser } from '@pro-fa/expr-eval';

// After
import { Parser } from '@pro-fa/expreszo';
```

Subpath imports follow the same pattern:

```typescript
// Before
import { coreParser } from '@pro-fa/expr-eval/core';
import { withMath } from '@pro-fa/expr-eval/math';

// After
import { coreParser } from '@pro-fa/expreszo/core';
import { withMath } from '@pro-fa/expreszo/math';
```

All available subpath imports: `/core`, `/math`, `/string`, `/array`, `/object`, `/comparison`, `/logical`, `/type-check`, `/utility`, `/validation`, `/language-service`.

### What's the Same

- Core expression syntax (arithmetic, comparison, logical operators)
- Built-in math functions (sin, cos, sqrt, etc.)
- Expression methods (evaluate, simplify, variables)
- Parser configuration for enabling/disabling operators
- All types are exported from the main package:
  ```typescript
  import { Parser, Expression, Value, Values } from '@pro-fa/expreszo';
  ```

### What's New Compared to the Original expr-eval

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
| Pratt parser | Faster parsing, better error messages, 256-level depth limit |
| Tree-shakeable presets | Compose minimal parsers with `defineParser()` |

### Behavior Changes from the Original

**Undefined handling** — the original library threw errors for undefined values. ExpresZo handles them gracefully:

```js
parser.evaluate('x + 1', { x: undefined }); // undefined (original: error)
parser.evaluate('x ?? 0 + 1', { x: undefined }); // 1 (coalesce fallback)
```

**Property access** — missing properties return `undefined` instead of throwing:

```js
parser.evaluate('user.email', { user: { name: 'Ada' } }); // undefined
```

---

## Legacy Mode

ExpresZo includes a **legacy mode** that preserves older operator and function behavior from the original expr-eval library. This is useful when you have existing expressions that depend on the original semantics and you want to migrate incrementally.

### Enabling Legacy Mode

```typescript
import { Parser } from '@pro-fa/expreszo';

const parser = new Parser();                    // modern behavior (default)
const legacyParser = new Parser({ legacy: true }); // legacy behavior
```

### What Legacy Mode Changes

#### Arithmetic: `+` (addition)

| Scenario | Modern | Legacy |
|----------|--------|--------|
| `"3" + "4"` (non-numeric strings) | `NaN` | `"34"` (string concatenation with deprecation warning) |
| `[1, 2] + [3, 4]` | Throws error | `[1, 2, 3, 4]` (array concatenation with deprecation warning) |
| `{a: 1} + {b: 2}` | Throws error | `{a: 1, b: 2}` (object merge with deprecation warning) |

In modern mode, use `|` for concatenation and `merge()` for objects.

#### Arithmetic: `/` (division)

| Scenario | Modern | Legacy |
|----------|--------|--------|
| `1 / 0` | Throws `"Division by zero"` | `Infinity` (with deprecation warning) |
| `0 / 0` | Throws `"Division by zero"` | `NaN` (with deprecation warning) |

In modern mode, use the `??` operator for fallback: `(a / b) ?? 0`.

#### Concatenation: `|` (pipe)

| Scenario | Modern | Legacy |
|----------|--------|--------|
| `42 | " items"` | `"42 items"` (mixed types coerced to string) | `undefined` (strict: both must be strings or both arrays) |

#### Comparison: `>`, `<`, `>=`, `<=`

| Scenario | Modern | Legacy |
|----------|--------|--------|
| `undefined > 5` | `undefined` | `false` (JavaScript coercion) |
| `undefined < 5` | `undefined` | `false` |

Modern mode propagates `undefined` through comparisons. Legacy mode performs JavaScript's default coercion, which can produce surprising results.

#### Function: `indexOf()` and `join()`

The parameter order is reversed in legacy mode:

| Function | Modern | Legacy |
|----------|--------|--------|
| `indexOf` | `indexOf(arrayOrString, target)` | `indexOf(target, arrayOrString)` |
| `join` | `join(array, separator)` | `join(separator, array)` |

#### Function: `if()`

| Mode | Behavior |
|------|----------|
| Modern | **Lazy evaluation** — only the matching branch is evaluated |
| Legacy | **Eager evaluation** — all three arguments are evaluated before the condition is checked |

```typescript
// Modern: safe — the else branch is never evaluated
parser.evaluate('if(true, x, 1 / y)', { x: 42, y: 0 }); // 42

// Legacy: throws — all branches are evaluated eagerly
const legacy = new Parser({ legacy: true });
legacy.evaluate('if(true, x, 1 / y)', { x: 42, y: 0 }); // Error!
```

### Migration Strategy

1. **Start with legacy mode** if you have many existing expressions:
   ```typescript
   const parser = new Parser({ legacy: true });
   ```

2. **Run your test suite** — everything should pass unchanged.

3. **Switch to modern mode** and fix any failing tests. The most common issues are:
   - `+` used for string/array concatenation → replace with `|`
   - `indexOf` / `join` argument order → swap the arguments
   - Division by zero returning `Infinity` → add a `?? 0` fallback

4. **Remove the legacy flag** once all expressions are updated.

Legacy mode emits deprecation warnings to the console for behaviors that differ from modern mode, helping you find expressions that need updating.

---

## Version History

### Version 5.0.0

**Critical security change: Functions must be registered explicitly.**

This addresses several security vulnerabilities (CVE-2025-12735, CVE-2025-13204).

```js
// BEFORE (vulnerable, no longer works)
parser.evaluate('customFunc()', { customFunc: () => 'result' });

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

**Protected properties** — access to `__proto__`, `prototype`, and `constructor` is blocked.

### Version 4.0.0

**Concatenation operator changed from `||` to `|`:**

```js
// BEFORE (original expr-eval 2.x)
"hello" || " world"     // "hello world" (concatenation)

// AFTER (v4.0.0+)
"hello" | " world"      // "hello world" (concatenation with |)
true || false           // true (logical OR — new)
true && false           // false (logical AND — new)
```

## Getting Help

If you encounter issues during migration:

1. Check the [Breaking Changes](breaking-changes.md) for detailed version-by-version changes
2. Review the documentation for the feature you're using
3. Open an issue on GitHub with a minimal reproduction case
