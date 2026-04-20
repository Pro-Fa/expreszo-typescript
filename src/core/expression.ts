import type { Node } from '../ast/nodes.js';
import type { NodeVisitor } from '../ast/visitor.js';
import { simplifyAst } from '../ast/visitors/simplify.js';
import { substituteAst } from '../ast/visitors/substitute.js';
import { containsAsyncCall } from '../ast/visitors/async-analysis.js';
import { evaluateAstSync } from '../eval/sync-evaluator.js';
import { evaluateAstAsync } from '../eval/async-evaluator.js';
import { AsyncRequiredError } from '../eval/value.js';
import { nodeToString } from '../ast/visitors/to-string.js';
import { getSymbolsFromNode } from '../ast/visitors/get-symbols.js';
import type {
  OperatorFunction,
  Value,
  SymbolOptions,
  VariableResolveResult,
  VariableResolver,
  ReadonlyValues
} from '../types/index.js';

// Parser interface (will be more complete when we convert parser.js)
interface ParserLike {
  unaryOps: Record<string, OperatorFunction>;
  binaryOps: Record<string, OperatorFunction>;
  ternaryOps: Record<string, OperatorFunction>;
  functions: Record<string, OperatorFunction>;
  legacy?: boolean;
  resolve: (token: string) => VariableResolveResult;
  isOperatorEnabled: (op: string) => boolean;
  parse(expression: string): Expression;
}

export class Expression {
  readonly #root: Node;
  public parser: ParserLike;
  public unaryOps: Record<string, OperatorFunction>;
  public binaryOps: Record<string, OperatorFunction>;
  public ternaryOps: Record<string, OperatorFunction>;
  public functions: Record<string, OperatorFunction>;
  public legacy: boolean;

  /**
   * Cached result of the async-analysis visitor. `undefined` means "not yet
   * computed"; `true` routes straight to the async evaluator; `false` lets
   * the sync evaluator run and upgrades to async only if it raises
   * `AsyncRequiredError` (at which point this flag flips to `true`).
   */
  private isAsync: boolean | undefined;

  private cachedString: string | undefined;

  /**
   * Creates a new Expression instance. Usually created via Parser.parse().
   *
   * @param root - The AST root node
   * @param parser - The parser instance that created this expression
   * @internal
   */
  constructor(root: Node, parser: ParserLike) {
    this.#root = root;
    this.parser = parser;
    this.unaryOps = parser.unaryOps;
    this.binaryOps = parser.binaryOps;
    this.ternaryOps = parser.ternaryOps;
    this.functions = parser.functions;
    this.legacy = parser.legacy ?? false;
  }

  /**
   * Run an arbitrary visitor against the internal AST. This is the supported
   * way for advanced consumers (e.g. a custom linter, analyzer, or
   * alternative codegen target) to walk the expression without poking at
   * private fields. The AST itself remains opaque.
   */
  accept<T>(visitor: NodeVisitor<T>): T {
    return visitor.visit(this.#root);
  }

  /**
   * Returns a simplified version of this expression.
   * Attempts to pre-compute parts of the expression that don't depend on variables.
   *
   * @param values - Optional object containing known variable values for simplification
   * @returns A new simplified Expression instance
   * @example
   * ```typescript
   * const expr = parser.parse('2 + 3 + x');
   * const simplified = expr.simplify(); // Results in '5 + x'
   * ```
   */
  simplify(values?: ReadonlyValues): Expression {
    const safeValues = values || {};
    const simplifiedRoot = simplifyAst(this.#root, {
      unaryOps: this.unaryOps,
      binaryOps: this.binaryOps,
      ternaryOps: this.ternaryOps,
      values: safeValues
    });

    return new Expression(simplifiedRoot, this.parser);
  }

  /**
   * Substitutes a variable with another expression.
   *
   * @param variable - The variable name to substitute
   * @param expr - The expression or expression string to substitute with
   * @returns A new Expression instance with the substitution applied
   * @example
   * ```typescript
   * const expr = parser.parse('x + y');
   * const substituted = expr.substitute('x', '2 * z'); // Results in '2 * z + y'
   * ```
   */
  substitute(variable: string, expr: string | Expression): Expression {
    const replacement = expr instanceof Expression
      ? expr
      : this.parser.parse(String(expr));

    return new Expression(
      substituteAst(this.#root, variable, replacement.#root),
      this.parser
    );
  }

  /**
   * Evaluates the expression with the given variable values.
   *
   * Accepts either a `values` object, a `resolver` function, or both. When a
   * function is passed as the first argument it is treated as the resolver and
   * no `values` object is used.
   *
   * @param values - Object containing variable values
   * @param resolver - Optional per-call variable resolver. Tried before the parser-level
   *   resolver (if any) when a variable is not present in `values`. Lets a single parsed
   *   Expression be evaluated multiple times against different variable sources without
   *   mutating parser state.
   * @returns The computed result of the expression
   * @throws {VariableError} When the expression references undefined variables
   * @throws {EvaluationError} When runtime evaluation fails
   * @example
   * ```typescript
   * const expr = parser.parse('2 + 3 * x');
   * const result = expr.evaluate({ x: 4 }); // Returns 14
   *
   * // Per-call resolver only
   * const expr2 = parser.parse('$a + $b');
   * const result2 = expr2.evaluate((t) =>
   *   t.startsWith('$') ? { value: lookup(t.substring(1)) } : undefined
   * );
   *
   * // Values and resolver
   * const result3 = expr2.evaluate({}, (t) =>
   *   t.startsWith('$') ? { value: lookup(t.substring(1)) } : undefined
   * );
   * ```
   */
  evaluate(resolver: VariableResolver): Value | Promise<Value>;
  evaluate(values?: ReadonlyValues, resolver?: VariableResolver): Value | Promise<Value>;
  evaluate(
    valuesOrResolver?: ReadonlyValues | VariableResolver,
    resolver?: VariableResolver
  ): Value | Promise<Value> {
    let values: ReadonlyValues | undefined;
    let effectiveResolver: VariableResolver | undefined;
    if (typeof valuesOrResolver === 'function') {
      effectiveResolver = valuesOrResolver;
    } else {
      values = valuesOrResolver;
      effectiveResolver = resolver;
    }
    const safeValues = (values || {}) as Record<string, Value>;

    if (this.isAsync === undefined) {
      this.isAsync = containsAsyncCall(this.#root, { functions: this.functions });
    }
    if (this.isAsync) {
      return evaluateAstAsync(this.#root, this, safeValues, effectiveResolver);
    }

    try {
      return evaluateAstSync(this.#root, this, safeValues, effectiveResolver);
    } catch (err) {
      if (err instanceof AsyncRequiredError) {
        this.isAsync = true;
        return evaluateAstAsync(this.#root, this, safeValues, effectiveResolver);
      }
      throw err;
    }
  }

  /**
   * Returns a string representation of the expression.
   *
   * @returns The expression as a human-readable string
   * @example
   * ```typescript
   * const expr = parser.parse('2 + 3 * x');
   * console.log(expr.toString()); // "2 + 3 * x"
   * ```
   */
  toString(): string {
    if (this.cachedString === undefined) {
      this.cachedString = nodeToString(this.#root);
    }
    return this.cachedString;
  }

  /**
   * Returns an array of all symbols (variables and functions) used in the expression.
   *
   * @param options - Options for symbol extraction
   * @param options.withMembers - Whether to include member access chains
   * @returns Array of symbol names
   * @example
   * ```typescript
   * const expr = parser.parse('x + sin(y) + obj.prop');
   * const symbols = expr.symbols(); // ['x', 'sin', 'y', 'obj', 'prop']
   * const symbolsWithMembers = expr.symbols({ withMembers: true }); // ['x', 'sin', 'y', 'obj.prop']
   * ```
   */
  symbols(options?: SymbolOptions): string[] {
    options = options || {};
    const vars: string[] = [];
    getSymbolsFromNode(this.#root, vars, options);

    return vars;
  }

  /**
   * Returns an array of variables used in the expression (excludes function names).
   *
   * @param options - Options for variable extraction
   * @param options.withMembers - Whether to include member access chains
   * @returns Array of variable names
   * @example
   * ```typescript
   * const expr = parser.parse('x + sin(y) + obj.prop');
   * const variables = expr.variables(); // ['x', 'y', 'obj', 'prop'] (sin is excluded as it's a function)
   * ```
   */
  variables(options?: SymbolOptions): string[] {
    options = options || {};
    const vars: string[] = [];
    getSymbolsFromNode(this.#root, vars, options);
    const { functions } = this;

    return vars.filter(function (name) {
      return !(name in functions);
    });
  }

}
