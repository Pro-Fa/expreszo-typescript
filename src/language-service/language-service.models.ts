import { Parser } from '../parsing/parser';
import { BUILTIN_FUNCTIONS_BY_NAME } from '../registry/builtin/functions.js';
import type { FunctionDocs, FunctionParamDoc } from '../registry/function-descriptor.js';
import type { ArityInfo } from './language-service.types';
import type { SignatureInformation, ParameterInformation } from 'vscode-languageserver-types';
import { MarkupKind } from 'vscode-languageserver-types';

export class FunctionDetails {
  private readonly docBlock: FunctionDocs | undefined;

  constructor(private readonly parser: Parser, public readonly name: string) {
    this.docBlock = BUILTIN_FUNCTIONS_BY_NAME.get(this.name)?.docs;
  }

  private params(): readonly FunctionParamDoc[] {
    return this.docBlock?.params ?? [];
  }

  private arity(): number | undefined {
    if (this.docBlock) return this.params().length;
    const f: unknown = (this.parser.functions && this.parser.functions[this.name]) || (this.parser.unaryOps && this.parser.unaryOps[this.name]);
    return typeof f === 'function' ? f.length : undefined;
  }

  /**
   * Returns the arity information for this function:
   * - min: minimum number of required arguments
   * - max: maximum number of arguments, or undefined if variadic
   */
  public arityInfo(): ArityInfo | undefined {
    if (this.docBlock) {
      const params = this.params();
      if (params.length === 0) return { min: 0, max: 0 };

      const hasVariadic = params.some((p) => p.isVariadic);
      const requiredParams = params.filter((p) => !p.optional && !p.isVariadic);
      const optionalParams = params.filter((p) => p.optional && !p.isVariadic);

      const min = requiredParams.length;
      const max = hasVariadic ? undefined : requiredParams.length + optionalParams.length;

      return { min, max };
    }

    const f: unknown = (this.parser.functions && this.parser.functions[this.name]) || (this.parser.unaryOps && this.parser.unaryOps[this.name]);
    if (typeof f === 'function') {
      return { min: f.length, max: f.length };
    }
    return undefined;
  }

  public docs(): string | undefined {
    if (this.docBlock) {
      const params = this.params();
      const paramList = params.map((p) => `* \`${p.name}\`: ${p.description}`).join('\n');
      return `**${this.details()}**\n\n${this.docBlock.description}\n\n*Parameters:*\n${paramList}`;
    }

    if (this.parser.unaryOps && this.parser.unaryOps[this.name]) {
      return `${this.name} x: unary operator`;
    }

    return undefined;
  }

  public details(): string {
    if (this.docBlock) {
      const params = this.params();
      return `${this.name}(${params.map((p) => p.name).join(', ')})`;
    }

    const arity = this.arity();
    return arity != null
      ? `${this.name}(${Array.from({ length: arity }).map((_, i) => 'arg' + (i + 1)).join(', ')})`
      : `${this.name}(…)`;
  }

  public completionText(): string {
    if (this.docBlock) {
      const params = this.params();
      return `${this.name}(${params.map((p, i) => `\${${i + 1}:${p.name}}`).join(', ')})`;
    }

    const arity = this.arity();
    return arity != null
      ? `${this.name}(${Array.from({ length: arity }).map((_, i) => `\${${i + 1}}`).join(', ')})`
      : `${this.name}(…)`;
  }

  /**
   * Build an LSP SignatureInformation object for this function, including
   * per-parameter labels computed against the rendered signature string.
   */
  public signatureInformation(): SignatureInformation {
    const params = this.params();
    const label = this.details();

    const parameters: ParameterInformation[] = [];
    if (params.length > 0) {
      // Walk the rendered label and find `(start, end)` character offsets for
      // each parameter name in order. This lets the editor underline the
      // active parameter accurately regardless of whether names were quoted.
      let cursor = label.indexOf('(');
      if (cursor >= 0) cursor += 1;
      for (const p of params) {
        const start = label.indexOf(p.name, cursor);
        if (start < 0) {
          parameters.push({ label: p.name, documentation: p.description });
          continue;
        }
        const end = start + p.name.length;
        parameters.push({
          label: [start, end],
          documentation: p.description
        });
        cursor = end;
      }
    }

    const doc = this.docs();
    return {
      label,
      documentation: doc ? { kind: MarkupKind.Markdown, value: doc } : undefined,
      parameters
    };
  }
}
