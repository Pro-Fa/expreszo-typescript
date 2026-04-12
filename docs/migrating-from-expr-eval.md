# Migrating from expr-eval

> **Audience:** Developers currently using `expr-eval` or `@pro-fa/expr-eval` who want to switch to `@pro-fa/expreszo`.

ExpresZo Typescript is a direct continuation of the `@pro-fa/expr-eval` package. The expression language, API surface, and runtime behavior are identical — only the package name and branding have changed. This page walks you through the migration and explains the **legacy mode** option for preserving older operator behavior during the transition.

## Step 1: Swap the Package

```bash
# Remove the old package
npm uninstall expr-eval          # if you used the original silentmatt package
npm uninstall @pro-fa/expr-eval  # if you used the Pro-Fa fork

# Install ExpresZo
npm install @pro-fa/expreszo
```

## Step 2: Update Imports

Find and replace across your codebase:

```typescript
// Before
import { Parser } from 'expr-eval';
import { Parser } from '@pro-fa/expr-eval';
const { Parser } = require('expr-eval');
const { Parser } = require('@pro-fa/expr-eval');

// After
import { Parser } from '@pro-fa/expreszo';
const { Parser } = require('@pro-fa/expreszo');
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

## Step 3: Remove `@types/expr-eval`

ExpresZo ships its own TypeScript declarations. If you had the community types installed, remove them:

```bash
npm uninstall @types/expr-eval
```

## Step 4: Update Configuration References

If your code references the diagnostic `source` field or localStorage keys from the language service sample, note that these identifiers have changed:

| Before | After |
|--------|-------|
| `source: 'expr-eval'` | `source: 'expreszo'` |
| `[expr-eval] Deprecated: …` (console warning) | `[expreszo] Deprecated: …` |

## That's It

No expression syntax changes, no API changes, no behavior changes. If your code worked with `@pro-fa/expr-eval`, it works with `@pro-fa/expreszo` after updating the package name and imports.

---

## Legacy Mode

ExpresZo includes a **legacy mode** that preserves older operator and function behavior from the original expr-eval library. This is useful when you have existing expressions that depend on the original semantics and you want to migrate incrementally.

### Enabling Legacy Mode

Pass `{ legacy: true }` when creating a Parser instance:

```typescript
import { Parser } from '@pro-fa/expreszo';

// Modern behavior (default)
const parser = new Parser();

// Legacy behavior
const legacyParser = new Parser({ legacy: true });
```

### What Legacy Mode Changes

Legacy mode affects operators and functions that had their behavior tightened or corrected in newer versions. The table below lists every difference:

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
| `undefined >= 5` | `undefined` | `false` |
| `undefined <= 5` | `undefined` | `false` |

Modern mode propagates `undefined` through comparisons. Legacy mode performs JavaScript's default coercion, which can produce surprising results.

#### Function: `indexOf()`

| Mode | Signature | Example |
|------|-----------|---------|
| Modern | `indexOf(arrayOrString, target)` | `indexOf(["a", "b", "c"], "b")` returns `1` |
| Legacy | `indexOf(target, arrayOrString)` | `indexOf("b", ["a", "b", "c"])` returns `1` |

The parameter order is reversed.

#### Function: `join()`

| Mode | Signature | Example |
|------|-----------|---------|
| Modern | `join(array, separator)` | `join(["a", "b"], ", ")` returns `"a, b"` |
| Legacy | `join(separator, array)` | `join(", ", ["a", "b"])` returns `"a, b"` |

The parameter order is reversed.

#### Function: `if()`

| Mode | Behavior |
|------|----------|
| Modern | **Lazy evaluation** — only the matching branch is evaluated |
| Legacy | **Eager evaluation** — all three arguments are evaluated before the condition is checked |

This matters when branches have side effects or when an unmatched branch would throw an error:

```typescript
const parser = new Parser();

// Modern: only evaluates the "then" branch — safe even if y is 0
parser.evaluate('if(true, x, 1 / y)', { x: 42, y: 0 }); // 42

// Legacy: evaluates all branches — throws "Division by zero"
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
