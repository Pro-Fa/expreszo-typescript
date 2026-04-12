/**
 * Abstract syntax tree for parsed expressions.
 *
 * Phase 1 of the v7 modernization introduces this AST alongside the existing
 * RPN instruction array. A bridge (`from-instructions.ts`) converts the legacy
 * `Instruction[]` produced by the current parser into a `Node` tree. Phase 2
 * wires the parser to emit nodes directly and the RPN disappears.
 *
 * The node set is a structural mirror of the current RPN — short-circuit
 * semantics for `and`/`or`, the lazy RHS of `=`, and the special `?:` ternary
 * are kept on the `Binary` / `Ternary` nodes and interpreted by the visitors
 * rather than being split out into dedicated node kinds. That minimises Phase 1
 * churn; semantic refinements (Logical, Conditional, Assignment) come later.
 */
export interface Span {
  /** Inclusive start offset in the source expression (0-based). */
  readonly start: number;
  /** Exclusive end offset in the source expression. */
  readonly end: number;
}

/** Placeholder span used when the concrete source range is not yet available. */
export const NO_SPAN: Span = { start: 0, end: 0 };

export interface CaseArm {
  readonly when: Node;
  readonly then: Node;
}

export interface ObjectProperty {
  readonly key: string;
  readonly value: Node;
  readonly quoted?: boolean;
}

export interface ObjectSpread {
  readonly type: 'ObjectSpread';
  readonly argument: Node;
  readonly span: Span;
}

export type ObjectEntry = ObjectProperty | ObjectSpread;

export interface ArraySpread {
  readonly type: 'ArraySpread';
  readonly argument: Node;
  readonly span: Span;
}

export type ArrayEntry = Node | ArraySpread;

export interface NumberLit {
  readonly type: 'NumberLit';
  readonly value: number;
  readonly span: Span;
}

export interface StringLit {
  readonly type: 'StringLit';
  readonly value: string;
  readonly span: Span;
}

export interface BoolLit {
  readonly type: 'BoolLit';
  readonly value: boolean;
  readonly span: Span;
}

export interface NullLit {
  readonly type: 'NullLit';
  readonly span: Span;
}

export interface UndefinedLit {
  readonly type: 'UndefinedLit';
  readonly span: Span;
}

/**
 * Opaque scalar wrapper for ISCALAR values that are neither number, string,
 * boolean, nor null (the legacy parser occasionally emits pre-computed objects
 * or arrays here — notably from simplified sub-expressions). Visitors that
 * round-trip AST into strings or values hand this through unchanged.
 */
export interface RawLit {
  readonly type: 'RawLit';
  readonly value: unknown;
  readonly span: Span;
}

export interface ArrayLit {
  readonly type: 'ArrayLit';
  readonly elements: readonly ArrayEntry[];
  readonly span: Span;
}

export interface ObjectLit {
  readonly type: 'ObjectLit';
  readonly properties: readonly ObjectEntry[];
  readonly span: Span;
}

/** Variable reference — corresponds to IVAR in the legacy RPN. */
export interface Ident {
  readonly type: 'Ident';
  readonly name: string;
  readonly span: Span;
}

/**
 * Declared name — corresponds to IVARNAME in the legacy RPN. Used as the target
 * of assignment/function-definition/lambda parameter lists. Visitors treat it
 * as a string-valued name literal rather than a dereference.
 */
export interface NameRef {
  readonly type: 'NameRef';
  readonly name: string;
  readonly span: Span;
}

export interface Member {
  readonly type: 'Member';
  readonly object: Node;
  readonly property: string;
  readonly span: Span;
}

export interface Unary {
  readonly type: 'Unary';
  readonly op: string;
  readonly operand: Node;
  readonly span: Span;
}

/**
 * Binary operator node. Covers arithmetic, comparison, logical (`and`/`or`),
 * indexing (`[`), assignment (`=`), and anything else the binary operator
 * table contains. Short-circuit and lazy-RHS semantics are applied by the
 * evaluator visitor at dispatch time based on `op`.
 */
export interface Binary {
  readonly type: 'Binary';
  readonly op: string;
  readonly left: Node;
  readonly right: Node;
  readonly span: Span;
}

/**
 * Ternary operator node. The conditional `?:` operator is represented with
 * `op === '?'`; visitors that care about short-circuit branching dispatch on
 * that specifically.
 */
export interface Ternary {
  readonly type: 'Ternary';
  readonly op: string;
  readonly a: Node;
  readonly b: Node;
  readonly c: Node;
  readonly span: Span;
}

export interface Call {
  readonly type: 'Call';
  readonly callee: Node;
  readonly args: readonly Node[];
  readonly span: Span;
}

export interface Lambda {
  readonly type: 'Lambda';
  readonly params: readonly string[];
  readonly body: Node;
  readonly span: Span;
}

export interface FunctionDef {
  readonly type: 'FunctionDef';
  readonly name: string;
  readonly params: readonly string[];
  readonly body: Node;
  readonly span: Span;
}

export interface Case {
  readonly type: 'Case';
  readonly subject: Node | null;
  readonly arms: readonly CaseArm[];
  readonly else: Node | null;
  readonly span: Span;
}

/**
 * Sequence of statements (`a; b; c`). The last statement is the expression's
 * value; earlier statements run for side effects.
 */
export interface Sequence {
  readonly type: 'Sequence';
  readonly statements: readonly Node[];
  readonly span: Span;
}

/**
 * Parenthesized subexpression. Mirrors the legacy `IEXPR` instruction, which
 * the old RPN-based `expression-to-string` wraps in `(...)`. Preserving the
 * node lets the AST round-trip through `toString` byte-for-byte against the
 * legacy output on the existing test corpus. Semantically transparent: the
 * other visitors (simplify, substitute, get-symbols, evaluate) treat it as a
 * pure passthrough and do not observe it.
 *
 * Phase 2 replaces this with real precedence-aware printing and `Paren`
 * disappears.
 */
export interface Paren {
  readonly type: 'Paren';
  readonly inner: Node;
  readonly span: Span;
}

export type Node =
  | NumberLit
  | StringLit
  | BoolLit
  | NullLit
  | UndefinedLit
  | RawLit
  | ArrayLit
  | ObjectLit
  | Ident
  | NameRef
  | Member
  | Unary
  | Binary
  | Ternary
  | Call
  | Lambda
  | FunctionDef
  | Case
  | Sequence
  | Paren;

export type NodeKind = Node['type'];

/** Narrowed lookup for `Extract<Node, { type: K }>`. */
export type NodeOfKind<K extends NodeKind> = Extract<Node, { type: K }>;

// --- Factory helpers -------------------------------------------------------

export function mkNumber(value: number, span: Span = NO_SPAN): NumberLit {
  return { type: 'NumberLit', value, span };
}

export function mkString(value: string, span: Span = NO_SPAN): StringLit {
  return { type: 'StringLit', value, span };
}

export function mkBool(value: boolean, span: Span = NO_SPAN): BoolLit {
  return { type: 'BoolLit', value, span };
}

export function mkNull(span: Span = NO_SPAN): NullLit {
  return { type: 'NullLit', span };
}

export function mkUndefined(span: Span = NO_SPAN): UndefinedLit {
  return { type: 'UndefinedLit', span };
}

export function mkRaw(value: unknown, span: Span = NO_SPAN): RawLit {
  return { type: 'RawLit', value, span };
}

export function mkArray(elements: readonly ArrayEntry[], span: Span = NO_SPAN): ArrayLit {
  return { type: 'ArrayLit', elements, span };
}

export function mkObject(properties: readonly ObjectEntry[], span: Span = NO_SPAN): ObjectLit {
  return { type: 'ObjectLit', properties, span };
}

export function mkArraySpread(argument: Node, span: Span = NO_SPAN): ArraySpread {
  return { type: 'ArraySpread', argument, span };
}

export function mkObjectSpread(argument: Node, span: Span = NO_SPAN): ObjectSpread {
  return { type: 'ObjectSpread', argument, span };
}

export function mkIdent(name: string, span: Span = NO_SPAN): Ident {
  return { type: 'Ident', name, span };
}

export function mkNameRef(name: string, span: Span = NO_SPAN): NameRef {
  return { type: 'NameRef', name, span };
}

export function mkMember(object: Node, property: string, span: Span = NO_SPAN): Member {
  return { type: 'Member', object, property, span };
}

export function mkUnary(op: string, operand: Node, span: Span = NO_SPAN): Unary {
  return { type: 'Unary', op, operand, span };
}

export function mkBinary(op: string, left: Node, right: Node, span: Span = NO_SPAN): Binary {
  return { type: 'Binary', op, left, right, span };
}

export function mkTernary(op: string, a: Node, b: Node, c: Node, span: Span = NO_SPAN): Ternary {
  return { type: 'Ternary', op, a, b, c, span };
}

export function mkCall(callee: Node, args: readonly Node[], span: Span = NO_SPAN): Call {
  return { type: 'Call', callee, args, span };
}

export function mkLambda(params: readonly string[], body: Node, span: Span = NO_SPAN): Lambda {
  return { type: 'Lambda', params, body, span };
}

export function mkFunctionDef(name: string, params: readonly string[], body: Node, span: Span = NO_SPAN): FunctionDef {
  return { type: 'FunctionDef', name, params, body, span };
}

export function mkCase(
  subject: Node | null,
  arms: readonly CaseArm[],
  elseBranch: Node | null,
  span: Span = NO_SPAN
): Case {
  return { type: 'Case', subject, arms, else: elseBranch, span };
}

export function mkSequence(statements: readonly Node[], span: Span = NO_SPAN): Sequence {
  return { type: 'Sequence', statements, span };
}

export function mkParen(inner: Node, span: Span = NO_SPAN): Paren {
  return { type: 'Paren', inner, span };
}
