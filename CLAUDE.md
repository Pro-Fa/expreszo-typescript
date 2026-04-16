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

**ExpresZo Typescript** is a safe, extensible expression evaluator — a configurable alternative to JavaScript's `eval()`. It uses a **Pratt parser** and an **immutable AST**:

```
Expression string → TokenStream (lexer) → Pratt Parser → AST (immutable) → Evaluator (AST walker) → Result
```

### Key classes

- **`Parser`** (`src/parsing/parser.ts`) — entry point; configurable with custom operators, functions, and variable resolvers; produces `Expression` objects
- **`Expression`** (`src/core/expression.ts`) — compiled expression with methods: `evaluate()`, `simplify()`, `substitute()`, `toString()`, `variables()`, `symbols()`
- **`Evaluator`** (`src/eval/sync-evaluator.ts`, `src/eval/async-evaluator.ts`) — AST walker that evaluates expressions; supports async (Promise) evaluation
- **`TokenStream`** (`src/parsing/token-stream.ts`) — lexer that converts expression strings to tokens
- **`AST Nodes`** (`src/ast/nodes.ts`) — immutable AST node types with a visitor pattern (`src/ast/visitor.ts`)

### Source layout

```
src/
├── ast/            # AST node types and visitor pattern
├── core/           # Expression, logical operations
├── eval/           # Sync and async evaluators (AST walkers)
├── parsing/        # Pratt parser, TokenStream, token types, parser-state + utils
├── operators/      # Binary (arithmetic, comparison, logical, utility) and unary operators
├── functions/      # Built-ins split by domain: math/, array/, string/, object/, utility/
├── api/            # defineParser and tree-shakeable presets
├── registry/       # Built-in function documentation and descriptors
├── language-service/ # IDE completions, hover, diagnostics
├── mcp-server/     # MCP server for AI assistant integration
├── validation/     # Expression validation
├── types/          # Shared TypeScript types and type guards
├── errors/         # Error context helpers
├── utils/          # Shared utilities
└── entries/        # Subpath export entry points
```

### Build targets

Controlled via the `BUILD_TARGET` env var in `vite.config.ts`:
- `esm` (default) — ES module with `.d.ts` declarations → `dist/index.mjs`
- `umd` — universal bundle → `dist/bundle.js`
- `umd-min` — minified UMD → `dist/bundle.min.js`

### Code style

ESLint enforces: semicolons, single quotes, 2-space indentation. TypeScript strict mode is on. `@typescript-eslint/no-explicit-any` is relaxed.
