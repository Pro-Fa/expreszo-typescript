// Language-service docs for keywords and default constants. Function docs
// live on `FunctionDescriptor.docs` in `src/registry/builtin/function-docs.ts`
// and are read via `BUILTIN_FUNCTIONS_BY_NAME`.

export const BUILTIN_KEYWORD_DOCS: Record<string, string> = {
  undefined: 'Represents an undefined value.',
  case: 'Start of a case-when-then-else-end block.',
  when: 'Case branch condition.',
  then: 'Then branch result.',
  else: 'Else branch result.',
  end: 'End of case block.'
};

export const DEFAULT_CONSTANT_DOCS: Record<string, string> = {
  E: 'Math.E',
  PI: 'Math.PI',
  true: 'Logical true',
  false: 'Logical false',
  null: 'Null value'
};
