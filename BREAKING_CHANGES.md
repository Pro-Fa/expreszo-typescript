# Breaking Changes

This document lists breaking changes in the library to help users migrate between versions.

## Version 7.0.0

### Architecture: AST Replaces Stack-Based Bytecode

The internal representation has been rewritten from RPN instruction tokens to an immutable AST with a visitor pattern. The parser has been replaced by a Pratt parser. These are implementation details, but they surface in a few places:

**`Expression.tokens` removed**

The `tokens: Instruction[]` property no longer exists. The internal AST is private (`#root`). Use the new visitor API to inspect expression structure:

```typescript
// Before (v6)
const expr = parser.parse('x + 1');
console.log(expr.tokens); // Instruction[]

// After (v7)
const expr = parser.parse('x + 1');
expr.accept(myVisitor); // NodeVisitor<T>
```

**`Instruction` type removed**

The `Instruction` class (`ISCALAR`, `IOP1`, `IOP2`, `IVAR`, `IFUNCALL`, etc.) is no longer part of the public API. If you were constructing or inspecting instructions directly, use the AST visitor pattern instead.

### `Expression.toJSFunction()` Removed

The `toJSFunction()` method has been removed. It relied on `new Function()` with `with` statements, which is incompatible with strict mode and CSP policies.

```typescript
// Before (v6)
const fn = parser.parse('x + 1').toJSFunction('x');
fn(4); // 5

// After (v7) — use evaluate() directly
const expr = parser.parse('x + 1');
const fn = (x: number) => expr.evaluate({ x });
fn(4); // 5
```

### `Parser.parse()` and `Parser.evaluate()` Static Methods Removed

The static convenience methods on `Parser` have been removed. Create an instance instead:

```typescript
// Before (v6)
Parser.parse('x + 1');
Parser.evaluate('x + 1', { x: 4 });

// After (v7)
const parser = new Parser();
parser.parse('x + 1');
parser.evaluate('x + 1', { x: 4 });
```

### Expression Constructor Signature Changed

The `Expression` constructor now takes `(root: Node, parser: ParserLike)` instead of `(tokens: Instruction[], parser: ParserLike)`. This is an internal API — expressions should always be created via `Parser.parse()`.

### Parser Recursion Depth Limit (256)

The Pratt parser enforces a maximum nesting depth of 256 to prevent stack overflow DoS attacks. Deeply nested expressions (e.g. 300 nested parentheses or 260 nested ternaries) will throw a `ParseError`. Reasonable expressions are unaffected.

```typescript
// Throws ParseError in v7
const expr = '('.repeat(300) + '1' + ')'.repeat(300);
parser.parse(expr); // ParseError: Expression nesting exceeds maximum depth
```

### New Exports

The following are new in v7 and do not break existing code, but are listed for awareness:

- **`defineParser(config)`** — Create a tree-shakeable parser from descriptor arrays
- **Presets** — `coreParser`, `withMath`, `withString`, `withArray`, `withObject`, `withComparison`, `withLogical`, `withTypeCheck`, `withUtility`, `fullParser`
- **Subpath exports** — `expreszo/core`, `expreszo/math`, etc.
- **`Expression.accept(visitor)`** — Run a `NodeVisitor<T>` against the AST
- **Types** — `ParserConfig`, `ParserPreset`

### What's Unchanged

- `new Parser(options?)` constructor and all instance methods
- `parser.parse(expr)` / `parser.evaluate(expr, vars)` instance methods
- `parser.functions`, `parser.unaryOps`, `parser.binaryOps`, `parser.ternaryOps`
- `Expression.evaluate()`, `.simplify()`, `.substitute()`, `.toString()`, `.symbols()`, `.variables()`
- All `ParserOptions` (operator gates, `allowMemberAccess`)
- All error classes (`ParseError`, `EvaluationError`, `ArgumentError`, `AccessError`, `VariableError`, `FunctionError`)
- Expression syntax (all operators, built-in functions, inline function definitions)
- `createLanguageService()` API

## Version 6.0.0

`null` is no longer silently casted to `0`. This means that from version 6 onwards, `null == 0` will no longer be true and `null == someVariable` with `someVariable` having a null value will become true. (This was not the case before.)

## Version 5.0.0

### Security: Functions Must Be Registered Explicitly

**Background**: This change addresses critical security vulnerabilities:
- [CVE-2025-12735](https://github.com/advisories/GHSA-jc85-fpwf-qm7x) - Code injection via arbitrary function calls
- [CVE-2025-13204](https://github.com/advisories) - Prototype pollution via `__proto__`, `prototype`, `constructor` access
- [silentmatt/expr-eval#289](https://github.com/silentmatt/expr-eval/issues/289) - Member function call bypass

**What Changed**: Functions can no longer be passed directly via the evaluation context. All functions that need to be called from expressions must be explicitly registered in `parser.functions`.

**Before (Vulnerable)**:
```typescript
const parser = new Parser();

// This pattern is NO LONGER ALLOWED
parser.evaluate('customFunc()', { customFunc: () => 'result' });

// This also NO LONGER WORKS
parser.evaluate('obj.method()', { 
  obj: { 
    method: () => 'dangerous' 
  } 
});
```

**After (Secure)**:
```typescript
const parser = new Parser();

// Register functions explicitly
parser.functions.customFunc = () => 'result';
parser.evaluate('customFunc()');

// For methods on objects, register them as top-level functions
parser.functions.objMethod = () => 'safe';
parser.evaluate('objMethod()');
```

**What Still Works**:
- Passing primitive values (strings, numbers, booleans) via context
- Passing arrays and objects with non-function properties via context
- Using built-in Math functions (sin, cos, sqrt, etc.)
- Using inline-defined functions in expressions: `(f(x) = x * 2)(5)`
- Using functions registered in `parser.functions`

**Migration Guide**:

1. **Identify function usage**: Search your codebase for patterns like `evaluate('...', { fn: ... })` where `fn` is a function.

2. **Register functions before evaluation**:
   ```typescript
   // Before
   parser.evaluate('calculate(x)', { calculate: myFunc, x: 5 });
   
   // After
   parser.functions.calculate = myFunc;
   parser.evaluate('calculate(x)', { x: 5 });
   ```

3. **For dynamic functions**: If you need to register functions dynamically:
   ```typescript
   const parser = new Parser();
   parser.functions.dynamicFn = createDynamicFunction();
   const result = parser.evaluate('dynamicFn()');
   delete parser.functions.dynamicFn; // Clean up if needed
   ```

### Protected Properties

Access to the following properties is now blocked to prevent prototype pollution attacks:
- `__proto__`
- `prototype`
- `constructor`

Attempting to access these properties in variable names or member expressions will throw an `AccessError`.

**Example**:
```typescript
// These will throw AccessError
parser.evaluate('x.__proto__', { x: {} });
parser.evaluate('__proto__', { __proto__: {} });
```

## Version 4.0.0

### Concatenation Operator Changed from `||` to `|`

**What Changed**: The `||` operator was repurposed for logical OR (JavaScript-style). A new `|` (pipe) operator was introduced for array and string concatenation. Additionally, the `&&` operator was added for logical AND.

**Before (original expr-eval 2.x)**:
```typescript
// || was used for concatenation
parser.evaluate('"hello" || " world"');  // "hello world"
parser.evaluate('[1, 2] || [3, 4]');     // [1, 2, 3, 4]
```

**After (v4.0.0+)**:
```typescript
// | is now used for concatenation
parser.evaluate('"hello" | " world"');   // "hello world"
parser.evaluate('[1, 2] | [3, 4]');      // [1, 2, 3, 4]

// || is now logical OR
parser.evaluate('true || false');        // true
parser.evaluate('false || true');        // true

// && is logical AND (new)
parser.evaluate('true && false');        // false
parser.evaluate('true && true');         // true
```

**Migration Guide**:

1. **Find concatenation usage**: Search your expressions for `||` used with strings or arrays
2. **Replace with pipe**: Change `||` to `|` for concatenation operations
3. **Review logical operations**: If you were using `or` keyword, you can now also use `||`

### Package Renamed

The package was renamed from `expr-eval` to `expreszo` and ported to TypeScript.

```bash
# Remove old package
npm uninstall expr-eval

# Install new package
npm install expreszo
```

Update imports:
```typescript
// Before
const { Parser } = require('expr-eval');

// After
import { Parser } from 'expreszo';
```
