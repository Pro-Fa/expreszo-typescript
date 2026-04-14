/**
 * AST → source pretty-printer. Produces a normalized but precedence-aware
 * string by trusting `Paren` nodes for grouping rather than wrapping every
 * binary/unary in parens the way the legacy `ToStringVisitor` does.
 *
 * Multi-line rendering for `Case`, `ArrayLit`, and `ObjectLit` kicks in
 * when the node's original source span crosses multiple lines; otherwise
 * the output stays on one line. `Call` nodes break onto multiple lines
 * whenever any argument is itself a `Call`, `Lambda`, or `FunctionDef`,
 * so nested function calls render as a readable indented tree.
 */
import type { TextDocument } from 'vscode-languageserver-textdocument';
import type {
  Node,
  NumberLit,
  StringLit,
  BoolLit,
  NullLit,
  UndefinedLit,
  RawLit,
  ArrayLit,
  ObjectLit,
  ObjectProperty,
  ObjectSpread,
  Ident,
  NameRef,
  Member,
  Unary,
  Binary,
  Ternary,
  Call,
  Lambda,
  FunctionDef,
  Case,
  Sequence,
  Paren,
  Span
} from '../../ast/nodes.js';

export interface FormatOptions {
  indentSize?: number;
}

const DEFAULT_OPTIONS: Required<FormatOptions> = { indentSize: 2 };

function escapeString(s: string): string {
  return JSON.stringify(s).replace(/\u2028/g, '\\u2028').replace(/\u2029/g, '\\u2029');
}

function isAlphaOp(op: string): boolean {
  return /^[a-zA-Z_][a-zA-Z0-9_]*$/.test(op);
}

const BINARY_PRECEDENCE: Record<string, number> = {
  '=': 1,
  'or': 2,
  '||': 2,
  'and': 3,
  '&&': 3,
  'in': 4,
  '==': 5, '!=': 5, '<': 5, '>': 5, '<=': 5, '>=': 5,
  '+': 6, '-': 6,
  '*': 7, '/': 7, '%': 7,
  '^': 8, '**': 8,
  '[': 100
};

function binaryPrecedence(op: string): number {
  return BINARY_PRECEDENCE[op] ?? 0;
}

const RIGHT_ASSOC = new Set(['^', '**', '=']);

export class PrettyPrinter {
  private readonly options: Required<FormatOptions>;

  constructor(
    private readonly doc: TextDocument,
    options: FormatOptions = {}
  ) {
    this.options = { ...DEFAULT_OPTIONS, ...options };
  }

  print(node: Node): string {
    return this.visit(node, 0, 0);
  }

  private spanCrossesLines(span: Span): boolean {
    if (span.start === 0 && span.end === 0) return false;
    const startLine = this.doc.positionAt(span.start).line;
    const endLine = this.doc.positionAt(span.end).line;
    return endLine > startLine;
  }

  private indent(level: number): string {
    return ' '.repeat(level * this.options.indentSize);
  }

  private visit(node: Node, indentLevel: number, parentPrec: number): string {
    switch (node.type) {
      case 'NumberLit': return this.visitNumberLit(node);
      case 'StringLit': return this.visitStringLit(node);
      case 'BoolLit': return this.visitBoolLit(node);
      case 'NullLit': return this.visitNullLit(node);
      case 'UndefinedLit': return this.visitUndefinedLit(node);
      case 'RawLit': return this.visitRawLit(node);
      case 'ArrayLit': return this.visitArrayLit(node, indentLevel);
      case 'ObjectLit': return this.visitObjectLit(node, indentLevel);
      case 'Ident': return this.visitIdent(node);
      case 'NameRef': return this.visitNameRef(node);
      case 'Member': return this.visitMember(node, indentLevel);
      case 'Unary': return this.visitUnary(node, indentLevel);
      case 'Binary': return this.visitBinary(node, indentLevel, parentPrec);
      case 'Ternary': return this.visitTernary(node, indentLevel, parentPrec);
      case 'Call': return this.visitCall(node, indentLevel);
      case 'Lambda': return this.visitLambda(node, indentLevel);
      case 'FunctionDef': return this.visitFunctionDef(node, indentLevel);
      case 'Case': return this.visitCase(node, indentLevel);
      case 'Sequence': return this.visitSequence(node, indentLevel);
      case 'Paren': return this.visitParen(node, indentLevel);
    }
  }

  private visitNumberLit(node: NumberLit): string {
    return String(node.value);
  }

  private visitStringLit(node: StringLit): string {
    return escapeString(node.value);
  }

  private visitBoolLit(node: BoolLit): string {
    return String(node.value);
  }

  private visitNullLit(_node: NullLit): string { return 'null'; }
  private visitUndefinedLit(_node: UndefinedLit): string { return 'undefined'; }

  private visitRawLit(node: RawLit): string {
    return JSON.stringify(node.value);
  }

  private visitArrayLit(node: ArrayLit, indentLevel: number): string {
    if (node.elements.length === 0) return '[]';
    const elements = node.elements.map((e) =>
      e.type === 'ArraySpread' ? '...' + this.visit(e.argument, indentLevel, 0) : this.visit(e, indentLevel, 0)
    );
    if (this.spanCrossesLines(node.span)) {
      const inner = this.indent(indentLevel + 1);
      const outer = this.indent(indentLevel);
      return '[\n' + elements.map(e => inner + e).join(',\n') + '\n' + outer + ']';
    }
    return '[' + elements.join(', ') + ']';
  }

  private visitObjectLit(node: ObjectLit, indentLevel: number): string {
    if (node.properties.length === 0) return '{}';
    const parts = node.properties.map((entry) => {
      if ('type' in entry && entry.type === 'ObjectSpread') {
        return '...' + this.visit((entry as ObjectSpread).argument, indentLevel, 0);
      }
      const p = entry as ObjectProperty;
      const keyStr = p.quoted ? JSON.stringify(p.key) : p.key;
      return `${keyStr}: ${this.visit(p.value, indentLevel, 0)}`;
    });
    if (this.spanCrossesLines(node.span)) {
      const inner = this.indent(indentLevel + 1);
      const outer = this.indent(indentLevel);
      return '{\n' + parts.map(p => inner + p).join(',\n') + '\n' + outer + '}';
    }
    return '{ ' + parts.join(', ') + ' }';
  }

  private visitIdent(node: Ident): string { return node.name; }
  private visitNameRef(node: NameRef): string { return node.name; }

  private visitMember(node: Member, indentLevel: number): string {
    return this.visit(node.object, indentLevel, 100) + '.' + node.property;
  }

  private visitUnary(node: Unary, indentLevel: number): string {
    const operand = this.visit(node.operand, indentLevel, 99);
    const op = node.op;
    if (op === '!') return operand + '!';
    if (op === '-' || op === '+') return op + operand;
    if (isAlphaOp(op)) return op + '(' + operand + ')';
    return op + operand;
  }

  private visitBinary(node: Binary, indentLevel: number, parentPrec: number): string {
    if (node.op === '[') {
      const left = this.visit(node.left, indentLevel, 100);
      const right = this.visit(node.right, indentLevel, 0);
      return left + '[' + right + ']';
    }
    const prec = binaryPrecedence(node.op);
    const rightAssoc = RIGHT_ASSOC.has(node.op);
    const left = this.visit(node.left, indentLevel, rightAssoc ? prec + 1 : prec);
    const right = this.visit(node.right, indentLevel, rightAssoc ? prec : prec + 1);
    const body = left + ' ' + node.op + ' ' + right;
    return prec < parentPrec ? '(' + body + ')' : body;
  }

  private visitTernary(node: Ternary, indentLevel: number, parentPrec: number): string {
    const a = this.visit(node.a, indentLevel, 1);
    const b = this.visit(node.b, indentLevel, 0);
    const c = this.visit(node.c, indentLevel, 0);
    if (node.op !== '?') throw new Error(`Unsupported ternary operator '${node.op}'`);
    const body = a + ' ? ' + b + ' : ' + c;
    return parentPrec > 0 ? '(' + body + ')' : body;
  }

  private visitCall(node: Call, indentLevel: number): string {
    const callee = this.visit(node.callee, indentLevel, 100);
    if (node.args.length === 0) return callee + '()';

    if (node.args.some(a => this.argForcesBreak(a))) {
      const inner = this.indent(indentLevel + 1);
      const outer = this.indent(indentLevel);
      const args = node.args.map(a => inner + this.visit(a, indentLevel + 1, 0));
      return callee + '(\n' + args.join(',\n') + '\n' + outer + ')';
    }

    const args = node.args.map(a => this.visit(a, indentLevel, 0));
    return callee + '(' + args.join(', ') + ')';
  }

  private argForcesBreak(arg: Node): boolean {
    return arg.type === 'Call' || arg.type === 'Lambda' || arg.type === 'FunctionDef';
  }

  private visitLambda(node: Lambda, indentLevel: number): string {
    const body = this.visit(node.body, indentLevel, 0);
    if (node.params.length === 1) return node.params[0] + ' => ' + body;
    return '(' + node.params.join(', ') + ') => ' + body;
  }

  private visitFunctionDef(node: FunctionDef, indentLevel: number): string {
    const body = this.visit(node.body, indentLevel, 0);
    return node.name + '(' + node.params.join(', ') + ') = ' + body;
  }

  private visitCase(node: Case, indentLevel: number): string {
    const multiLine = this.spanCrossesLines(node.span);
    const renderArm = (arm: { when: Node; then: Node }) =>
      `when ${this.visit(arm.when, indentLevel + 1, 0)} then ${this.visit(arm.then, indentLevel + 1, 0)}`;

    if (!multiLine) {
      const arms = node.arms.map(renderArm).join(' ');
      const elseClause = node.else ? ` else ${this.visit(node.else, indentLevel + 1, 0)}` : '';
      const subject = node.subject ? this.visit(node.subject, indentLevel, 0) + ' ' : '';
      return `case ${subject}${arms}${elseClause} end`;
    }

    const inner = this.indent(indentLevel + 1);
    const outer = this.indent(indentLevel);
    const lines: string[] = [];
    const header = node.subject
      ? `case ${this.visit(node.subject, indentLevel, 0)}`
      : 'case';
    lines.push(header);
    for (const arm of node.arms) {
      lines.push(inner + renderArm(arm));
    }
    if (node.else) {
      lines.push(inner + `else ${this.visit(node.else, indentLevel + 1, 0)}`);
    }
    lines.push(outer + 'end');
    return lines.join('\n');
  }

  private visitSequence(node: Sequence, indentLevel: number): string {
    return node.statements.map(s => this.visit(s, indentLevel, 0)).join('; ');
  }

  private visitParen(node: Paren, indentLevel: number): string {
    return '(' + this.visit(node.inner, indentLevel, 0) + ')';
  }
}
