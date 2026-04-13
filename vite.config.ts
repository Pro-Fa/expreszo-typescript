import { defineConfig } from 'vite';
import dts from 'vite-plugin-dts';
import { resolve } from 'path';

const buildTarget = process.env.BUILD_TARGET || 'esm';

export default defineConfig(() => {
  switch (buildTarget) {
    case 'umd':
      return {
        build: {
          outDir: 'dist',
          emptyOutDir: false,
          lib: {
            entry: resolve(__dirname, 'index.ts'),
            name: 'exprEval',
            formats: ['umd' as const],
            fileName: () => 'bundle.js'
          },
          rollupOptions: {
            output: {
              exports: 'named' as const
            }
          },
          minify: false
        },
        esbuild: {
          minifyIdentifiers: false,
          keepNames: true,
          target: 'es2020'
        }
      };

    case 'umd-min':
      return {
        build: {
          outDir: 'dist',
          emptyOutDir: false,
          lib: {
            entry: resolve(__dirname, 'index.ts'),
            name: 'exprEval',
            formats: ['umd' as const],
            fileName: () => 'bundle.min.js'
          },
          rollupOptions: {
            output: {
              exports: 'named' as const
            }
          },
          minify: 'terser' as const,
          terserOptions: {
            compress: {
              drop_console: true,
              drop_debugger: true,
              // Prevent void 0 replacement
              unsafe_undefined: false
            },
            mangle: {
              // Keep undefined as undefined
              reserved: ['undefined']
            },
            format: {
              // Preserve undefined instead of void 0
              preserve_annotations: true
            }
          }
        },
        esbuild: {
          minifyIdentifiers: false,
          keepNames: true,
          target: 'es2020'
        }
      };

    case 'esm':
    default:
      return {
        plugins: [
          dts({
            tsconfigPath: './tsconfig.build.json',
            insertTypesEntry: true
          })
        ],
        build: {
          outDir: 'dist',
          emptyOutDir: buildTarget === 'esm', // Only clean on first build
          lib: {
            // v7 multi-entry build. The root `index` re-exports the full
            // legacy surface for backwards compatibility within v7; the
            // per-category entries are the tree-shakeable subpaths
            // advertised in `package.json#exports`.
            entry: {
              index: resolve(__dirname, 'index.ts'),
              core: resolve(__dirname, 'src/entries/core.ts'),
              math: resolve(__dirname, 'src/entries/math.ts'),
              string: resolve(__dirname, 'src/entries/string.ts'),
              array: resolve(__dirname, 'src/entries/array.ts'),
              object: resolve(__dirname, 'src/entries/object.ts'),
              comparison: resolve(__dirname, 'src/entries/comparison.ts'),
              logical: resolve(__dirname, 'src/entries/logical.ts'),
              'type-check': resolve(__dirname, 'src/entries/type-check.ts'),
              utility: resolve(__dirname, 'src/entries/utility.ts'),
              validation: resolve(__dirname, 'src/entries/validation.ts'),
              'language-service': resolve(__dirname, 'src/entries/language-service.ts'),
              'mcp-server': resolve(__dirname, 'src/entries/mcp-server.ts'),
              'bin/mcp-server': resolve(__dirname, 'src/mcp-server/bin.ts')
            },
            name: 'exprEval',
            formats: ['es' as const]
          },
          rollupOptions: {
            external: [
              'zod',
              /^@modelcontextprotocol\/sdk(\/.*)?$/
            ],
            output: {
              exports: 'named' as const,
              preserveModules: false,
              inlineDynamicImports: false,
              entryFileNames: '[name].mjs',
              chunkFileNames: 'chunks/[name]-[hash].mjs',
              banner: (chunk) =>
                chunk.fileName === 'bin/mcp-server.mjs' ? '#!/usr/bin/env node' : ''
            }
          },
          minify: false
        },
        esbuild: {
          minifyIdentifiers: false,
          keepNames: true,
          target: 'es2020'
        }
      };
  }
});
