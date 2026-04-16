# Parser

> **Audience:** Developers integrating ExpresZo into their projects.

The `Parser` class is the main entry point for parsing and evaluating expressions.

## Quick Start

```js
import { Parser } from '@pro-fa/expreszo';

// Create a parser instance
const parser = new Parser();

// Or parse once and evaluate multiple times
const expr = parser.parse('2 * x + 1');
expr.evaluate({ x: 3 }); // 7
expr.evaluate({ x: 5 }); // 11
```

## Constructor

```js
const parser = new Parser(options?);
```

### Options

| Option | Type | Description |
|:-------|:-----|:------------|
| `operators` | `object` | Enable/disable specific operators (see table below) |

### Operator Configuration

All operators default to `true` (enabled) except where noted:

| Option Key | Default | Operators Affected |
|:-----------|:--------|:-------------------|
| `add` | `true` | `+` (addition) |
| `subtract` | `true` | `-` (subtraction) |
| `multiply` | `true` | `*` (multiplication) |
| `divide` | `true` | `/` (division) |
| `remainder` | `true` | `%` (modulo) |
| `power` | `true` | `^` (exponentiation) |
| `factorial` | `true` | `!` (factorial) |
| `concatenate` | `true` | `\|` (array/string concatenation) |
| `conditional` | `true` | `? :` (ternary) and `??` (coalesce) |
| `logical` | `true` | `and`, `or`, `not` |
| `comparison` | `true` | `==`, `!=`, `<`, `>`, `<=`, `>=` |
| `in` | **`false`** | `in`, `not in` |
| `assignment` | **`false`** | `=` (variable assignment) |
| `fndef` | `true` | Function definitions and arrow functions |
| `conversion` | **`false`** | `as` (type conversion) |

**Example: Restricted Parser**

```js
const parser = new Parser({
  operators: {
    // Disable logical and comparison
    logical: false,
    comparison: false,
    
    // Enable 'in' operator
    in: true,
    
    // Enable assignment
    assignment: true
  }
});
```

## Instance Methods

### parse(expression: string)

Convert an expression string into an `Expression` object.

```js
const expr = parser.parse('x * 2 + y');
```

Returns an [Expression](expression.md) object with methods like `evaluate()`, `simplify()`, `variables()`, etc.

### evaluate(expression: string, variables?: object, resolver?: VariableResolver)

Parse and immediately evaluate an expression.

```js
parser.evaluate('x + y', { x: 2, y: 3 }); // 5
```

The optional `resolver` callback is a per-call [custom variable resolver](advanced-features.md#custom-variable-name-resolution). It is tried before `parser.resolve` when a variable is not found in `variables`.

```js
parser.evaluate('$a + $b', {}, (name) =>
  name.startsWith('$') ? { value: lookup(name.substring(1)) } : undefined
); // per-call resolver; parser.resolve is not mutated
```

### evaluateObject(object, variables?, resolver?)

Recursively resolve every property of a plain object against a set of variables. Useful when a payload mixes literal values with expression strings.

```js
const parser = new Parser();

parser.evaluateObject(
  {
    name: 'user.name',
    ageNextYear: 'user.age + 1',
    label: 'plain string',
    scores: ['user.score', 'user.score * 2']
  },
  { user: { name: 'Jane', age: 29, score: 10 } }
);
// {
//   name: 'Jane',
//   ageNextYear: 30,
//   label: 'plain string',
//   scores: [10, 20]
// }
```

**String handling rules**

Each string leaf is treated as a *possible* expression:

1. The string is parsed. If parsing fails (`ParseError`), the original string is returned unchanged.
2. If parsing succeeds but the expression references no variables (e.g. `"42"`, `"2 + 3"`), the original string is returned unchanged. This preserves literal text and keeps types stable.
3. The expression is evaluated with `variables` and the optional per-call `resolver`. If evaluation raises a `VariableError` (i.e. the string looked like a bareword such as `"literal"` but no matching variable exists), the original string is returned unchanged. All other evaluation errors propagate.

Nested arrays and objects recurse. All other primitives (numbers, booleans, `null`, `undefined`) pass through untouched.

### evaluateArray(array, variables?, resolver?)

Array counterpart to `evaluateObject`. Each element is resolved with the same rules: strings that reference variables are evaluated, literal strings stay as-is, nested structures recurse, primitives pass through.

```js
parser.evaluateArray(
  ['x', 'x * 2', 'literal', { nested: 'x + 1' }],
  { x: 21 }
);
// [21, 42, 'literal', { nested: 22 }]
```

## Instance Properties

### parser.functions

An object containing all available functions. You can add, modify, or remove functions:

```js
const parser = new Parser();

// Add a custom function
parser.functions.double = (x) => x * 2;

// Add a function that returns a Promise (makes evaluate async)
parser.functions.fetchValue = async (id) => {
  const response = await fetch(`/api/values/${id}`);
  return response.json();
};

// Remove a built-in function
delete parser.functions.random;

// Use custom function
parser.evaluate('double(5)'); // 10

// Async evaluation
await parser.evaluate('fetchValue(123) * 2');
```

### parser.numericConstants

An object containing numeric constants. You can add, modify, or remove constants:

```js
const parser = new Parser();

// Add custom constants
parser.numericConstants.TAU = Math.PI * 2;
parser.numericConstants.GOLDEN_RATIO = 1.618033988749;

// Use in expressions
parser.evaluate('TAU'); // 6.283185307179586
parser.evaluate('2 * PI'); // 6.283185307179586 (PI is built-in)

// Remove all numeric constants
parser.numericConstants = {};
```

**Built-in Numeric Constants:**

| Constant | Value |
|:---------|:------|
| `E` | `Math.E` (~2.718) |
| `PI` | `Math.PI` (~3.14159) |
| `Infinity` | `Infinity` |
| `NaN` | `NaN` |

### parser.buildInLiterals

An object containing built-in literal values:

| Literal | Value |
|:--------|:------|
| `true` | `true` |
| `false` | `false` |
| `null` | `null` |

### parser.resolve

A callback for custom variable name resolution. Called when a variable name is not found in the provided variables object.

```js
const parser = new Parser();
const data = { variables: { a: 5, b: 10 } };

// Alias resolution: $v becomes 'variables'
parser.resolve = (name) => {
  if (name === '$v') {
    return { alias: 'variables' };
  }
  return undefined;
};

parser.evaluate('$v.a + $v.b', data); // 15

// Value resolution: return the value directly
parser.resolve = (name) => {
  if (name.startsWith('$')) {
    const key = name.substring(1);
    return { value: data.variables[key] };
  }
  return undefined;
};

parser.evaluate('$a + $b', {}); // 15
```

The `resolve` callback should return:
- `{ alias: string }` - to redirect to another variable name
- `{ value: any }` - to return a value directly
- `undefined` - to use default behavior (throws error for unknown variables)

For cases where different evaluations of the same parsed expression need different resolution logic, prefer passing a resolver directly to `Expression.evaluate(values, resolver)` or `parser.evaluate(expr, values, resolver)` instead of mutating `parser.resolve`. See [Per-Expression Variable Resolver](advanced-features.md#per-expression-variable-resolver).

## Advanced Configuration

### Type Conversion (as operator)

The `as` operator is disabled by default. When enabled, it provides basic type conversion:

```js
const parser = new Parser({ operators: { conversion: true } });

parser.evaluate('"1.6" as "number"');   // 1.6
parser.evaluate('"1.6" as "int"');      // 2 (rounded)
parser.evaluate('"1.6" as "integer"');  // 2 (rounded)
parser.evaluate('"1" as "boolean"');    // true
```

You can override the default `as` implementation:

```js
parser.binaryOps.as = (value, type) => {
  // Custom conversion logic
  if (type === 'date') {
    return new Date(value);
  }
  return value;
};
```

### Operator Customization

You can customize binary and unary operators via `parser.binaryOps` and `parser.unaryOps`:

```js
const parser = new Parser();

// Add a custom binary operator
parser.binaryOps['%%'] = (a, b) => ((a % b) + b) % b; // Positive modulo

// Note: Custom operators must be registered before parsing
```

## See Also

- [Expression](expression.md) - Expression object methods
- [Expression Syntax](syntax.md) - Complete syntax reference
- [Advanced Features](advanced-features.md) - Promises, SQL CASE, object construction
