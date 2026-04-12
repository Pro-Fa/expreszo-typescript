# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
# Build (ESM, UMD, minified UMD)
npm run build

# Run all tests (builds first)
npm test

# Run tests in watch mode
npm run test:watch

# Run a single test file
npx vitest run test/core/evaluate.ts

# Lint
npm run lint

# Type check
npm run type-check

# Coverage (80% threshold required)
npm run coverage

# Benchmarks
npm run bench
```

## Architecture

**ExpresZo Typescript** is a safe, extensible expression evaluator — a configurable alternative to JavaScript's `eval()`. It uses a **stack-based bytecode interpreter**:

```
Expression string → TokenStream (lexer) → Parser (ParserState + utils) → Instructions → Evaluator (stack VM) → Result
```

### Key classes

- **`Parser`** (`src/parsing/parser.ts`) — entry point; configurable with custom operators, functions, and variable resolvers; produces `Expression` objects
- **`Expression`** (`src/core/expression.ts`) — compiled expression with methods: `evaluate()`, `simplify()`, `substitute()`, `toJSFunction()`, `toString()`, `variables()`, `symbols()`
- **`Evaluator`** (`src/core/evaluate.ts`) — stack-based VM that processes `Instruction` tokens in RPN order; supports async (Promise) evaluation
- **`TokenStream`** (`src/parsing/token-stream.ts`) — lexer that converts expression strings to tokens
- **`Instruction`** (`src/parsing/instruction.ts`) — bytecode-style nodes: `ISCALAR`, `IOP1/IOP2/IOP3`, `IVAR`, `IFUNCALL`, `IARRAY`, etc.

### Source layout

```
src/
├── core/           # Expression, evaluate, simplify, substitute, toString, getSymbols
├── parsing/        # Parser, TokenStream, Instruction, token types, parser-state + utils
├── operators/      # Binary (arithmetic, comparison, logical, utility) and unary operators
├── functions/      # Built-ins split by domain: math/, array/, string/, object/, utility/
├── config/         # ParserConfigurationBuilder
├── language-service/ # IDE completions, hover, diagnostics
├── validation/     # Expression validation
├── types/          # Shared TypeScript types and type guards
└── errors/         # Error context helpers
```

### Build targets

Controlled via the `BUILD_TARGET` env var in `vite.config.ts`:
- `esm` (default) — ES module with `.d.ts` declarations → `dist/index.mjs`
- `umd` — universal bundle → `dist/bundle.js`
- `umd-min` — minified UMD → `dist/bundle.min.js`

### Code style

ESLint enforces: semicolons, single quotes, 2-space indentation. TypeScript strict mode is on. `@typescript-eslint/no-explicit-any` is relaxed.
