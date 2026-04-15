// Theme management
const themeToggle = document.getElementById('themeToggle');
const html = document.documentElement;
let monacoReady = false;

function getSystemTheme() {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

function getStoredTheme() {
    return localStorage.getItem('expreszo-theme');
}

function setTheme(theme) {
    if (theme === 'dark') {
        html.classList.add('dark');
    } else {
        html.classList.remove('dark');
    }
    localStorage.setItem('expreszo-theme', theme);
    if (monacoReady) {
        updateMonacoTheme();
    }
}

function initTheme() {
    const stored = getStoredTheme();
    const theme = stored || getSystemTheme();
    setTheme(theme);
}

themeToggle.addEventListener('click', () => {
    const isDark = html.classList.contains('dark');
    setTheme(isDark ? 'light' : 'dark');
});

// Listen for system theme changes
window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
    if (!getStoredTheme()) {
        setTheme(e.matches ? 'dark' : 'light');
    }
});

initTheme();

// Copy example link to clipboard
function copyExampleLink(exampleId, button) {
    const url = new URL(window.location.href);
    url.search = '';
    url.searchParams.set('example', exampleId);
    navigator.clipboard.writeText(url.toString()).then(() => {
        // Show checkmark briefly
        const icon = button.querySelector('svg');
        const originalPath = icon.innerHTML;
        icon.innerHTML = '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />';
        button.classList.add('text-green-500', 'dark:text-green-400');
        setTimeout(() => {
            icon.innerHTML = originalPath;
            button.classList.remove('text-green-500', 'dark:text-green-400');
        }, 1500);
    });
}

// Render examples sidebar
function renderExamplesSidebar() {
    const examplesList = document.getElementById('examplesList');
    if (!examplesList) return;

    examplesList.innerHTML = exampleCases.map(example => `
        <div class="example-container relative group/container">
            <button
                class="example-item w-full text-left p-3 rounded-lg transition-all duration-200
                       hover:bg-white dark:hover:bg-[#1f2937]
                       hover:shadow-sm hover:border-[#fed7aa] dark:hover:border-[#374151]
                       border border-transparent
                       group"
                data-example-id="${example.id}"
            >
                <div class="flex items-start gap-2">
                    <div class="flex-shrink-0 w-6 h-6 rounded bg-[#ffedd5] dark:bg-[#374151] flex items-center justify-center mt-0.5">
                        <svg class="w-3.5 h-3.5 text-[#f97316]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                    </div>
                    <div class="flex-1 min-w-0">
                        <p class="text-sm font-medium text-gray-800 dark:text-[#e5e7eb] truncate group-hover:text-[#f97316] dark:group-hover:text-[#f97316]">
                            ${example.title}
                        </p>
                        <p class="text-xs text-gray-500 dark:text-[#9ca3af] mt-0.5 line-clamp-2">
                            ${example.description}
                        </p>
                    </div>
                </div>
            </button>
            <button
                class="copy-link-btn absolute top-2 right-2 p-1.5 rounded-md
                       opacity-0 group-hover/container:opacity-100
                       bg-gray-100 dark:bg-[#374151] hover:bg-gray-200 dark:hover:bg-[#4b5563]
                       text-gray-500 dark:text-[#9ca3af] hover:text-[#f97316] dark:hover:text-[#f97316]
                       transition-all duration-200"
                data-example-id="${example.id}"
                title="Copy link to example"
            >
                <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                </svg>
            </button>
        </div>
    `).join('');

    // Add click handlers for loading examples
    examplesList.querySelectorAll('.example-item').forEach(button => {
        button.addEventListener('click', () => {
            const exampleId = button.dataset.exampleId;
            const example = exampleCases.find(e => e.id === exampleId);
            if (example) {
                loadExample(example);
            }
        });
    });

    // Add click handlers for copy link buttons
    examplesList.querySelectorAll('.copy-link-btn').forEach(button => {
        button.addEventListener('click', (e) => {
            e.stopPropagation();
            const exampleId = button.dataset.exampleId;
            copyExampleLink(exampleId, button);
        });
    });
}

// Load example into editors
function loadExample(example) {
    if (typeof expressionEditor !== 'undefined' && expressionEditor) {
        expressionEditor.getModel().setValue(example.expression);
    }
    if (typeof contextEditor !== 'undefined' && contextEditor) {
        contextEditor.getModel().setValue(JSON.stringify(example.context, null, 2));
    }
}

// Initialize sidebar
renderExamplesSidebar();

// Get example ID from URL query parameter
function getExampleFromUrl() {
    const params = new URLSearchParams(window.location.search);
    return params.get('example');
}

// Load example from URL if present (called after Monaco initializes)
function loadExampleFromUrl() {
    const exampleId = getExampleFromUrl();
    if (exampleId) {
        const example = exampleCases.find(e => e.id === exampleId);
        if (example) {
            loadExample(example);
            return true;
        }
    }
    return false;
}

// Vertical resizing for bottom split (context/results)
(function() {
    const resizer = document.getElementById('verticalResizer');
    const contextPane = document.getElementById('contextPane');
    const resultsPane = document.getElementById('resultsPane');
    const bottomArea = document.getElementById('bottomArea');
    let isResizing = false;

    resizer.addEventListener('mousedown', (e) => {
        e.preventDefault();
        isResizing = true;
        document.body.style.cursor = 'col-resize';
        document.body.style.userSelect = 'none';
    });

    document.addEventListener('mousemove', (e) => {
        if (!isResizing) return;
        e.preventDefault();

        const containerRect = bottomArea.getBoundingClientRect();
        const containerWidth = containerRect.width;
        const resizerWidth = 6;

        let newLeftWidth = e.clientX - containerRect.left;
        newLeftWidth = Math.max(containerWidth * 0.2, Math.min(containerWidth * 0.8, newLeftWidth));

        const percentage = (newLeftWidth / containerWidth) * 100;
        contextPane.style.width = percentage + '%';
    });

    document.addEventListener('mouseup', () => {
        if (isResizing) {
            isResizing = false;
            document.body.style.cursor = '';
            document.body.style.userSelect = '';
        }
    });
})();

// Horizontal resizing between expression pane and bottom split
(function() {
    const resizer = document.getElementById('horizontalResizer');
    const expressionPane = document.getElementById('expressionPane');
    const workArea = document.getElementById('workArea');
    let isResizing = false;

    resizer.addEventListener('mousedown', (e) => {
        e.preventDefault();
        isResizing = true;
        document.body.style.cursor = 'row-resize';
        document.body.style.userSelect = 'none';
    });

    document.addEventListener('mousemove', (e) => {
        if (!isResizing) return;
        e.preventDefault();

        const containerRect = workArea.getBoundingClientRect();
        const containerHeight = containerRect.height;

        let newTopHeight = e.clientY - containerRect.top;
        newTopHeight = Math.max(containerHeight * 0.15, Math.min(containerHeight * 0.85, newTopHeight));

        expressionPane.style.height = newTopHeight + 'px';

        // Monaco editors need an explicit layout kick when their container
        // changes size mid-drag, otherwise the viewport stays stale until
        // the next window resize.
        if (typeof expressionEditor !== 'undefined' && expressionEditor) {
            expressionEditor.layout();
        }
        if (typeof contextEditor !== 'undefined' && contextEditor) {
            contextEditor.layout();
        }
    });

    document.addEventListener('mouseup', () => {
        if (isResizing) {
            isResizing = false;
            document.body.style.cursor = '';
            document.body.style.userSelect = '';
        }
    });
})();

// Monaco configuration and initialization
require.config({paths: {'vs': 'https://cdn.jsdelivr.net/npm/monaco-editor@0.49.0/min/vs'}});

let expressionEditor, contextEditor;

function updateMonacoTheme() {
    const theme = html.classList.contains('dark') ? 'vs-dark' : 'vs';
    monaco.editor.setTheme(theme);
}

require(['vs/editor/editor.main'], function () {
    monacoReady = true;
    
    const languageId = 'expreszo';
    monaco.languages.register({id: languageId});

    // Language configuration — enables Monaco's built-in bracket matching,
    // auto-closing pairs, surround-with selection, and rainbow bracket
    // colourisation. No language-service code runs for this; Monaco handles
    // it all from the config below.
    monaco.languages.setLanguageConfiguration(languageId, {
        brackets: [['(', ')'], ['[', ']'], ['{', '}']],
        autoClosingPairs: [
            { open: '(', close: ')' },
            { open: '[', close: ']' },
            { open: '{', close: '}' },
            { open: '"', close: '"', notIn: ['string'] },
            { open: "'", close: "'", notIn: ['string'] }
        ],
        surroundingPairs: [
            { open: '(', close: ')' },
            { open: '[', close: ']' },
            { open: '{', close: '}' },
            { open: '"', close: '"' },
            { open: "'", close: "'" }
        ],
        comments: { lineComment: '//', blockComment: ['/*', '*/'] }
    });

    // Set initial theme
    const currentTheme = html.classList.contains('dark') ? 'vs-dark' : 'vs';

    // Default values - showcasing nested path access and deeper objects
    const defaultExpression = 'user.profile.score + config.timeout / 1000';
    const defaultContext = JSON.stringify({
        x: 42,
        y: 100,
        multiplier: 2,
        user: {
            name: "Ada",
            profile: {
                email: "ada@example.com",
                score: 95,
                level: 5
            },
            preferences: {
                theme: "dark",
                notifications: true
            }
        },
        config: {
            timeout: 5000,
            retries: 3,
            maxConnections: 10
        },
        items: [1, 2, 3, 4, 5]
    }, null, 2);

    // Load from localStorage or use defaults
    const savedExpression = localStorage.getItem('expreszo-expression') || defaultExpression;
    const savedContext = localStorage.getItem('expreszo-context') || defaultContext;
    const savedLegacy = localStorage.getItem('expreszo-legacy') === 'true';

    // Legacy-mode toggle — swaps parser operator implementations for `+`, `/`,
    // `|`, comparisons, `indexOf`, `join`.
    const legacyToggle = document.getElementById('legacyToggle');
    legacyToggle.checked = savedLegacy;
    let legacyMode = savedLegacy;

    // Create context editor (JSON)
    const contextModel = monaco.editor.createModel(savedContext, 'json');
    contextEditor = monaco.editor.create(document.getElementById('contextEditor'), {
        model: contextModel,
        theme: currentTheme,
        automaticLayout: true,
        fontSize: 14,
        minimap: {enabled: false},
        lineNumbers: 'on',
        scrollBeyondLastLine: false,
        wordWrap: 'on',
        tabSize: 2
    });

    // Create expression editor
    const expressionModel = monaco.editor.createModel(savedExpression, languageId);
    expressionEditor = monaco.editor.create(document.getElementById('expressionEditor'), {
        model: expressionModel,
        theme: currentTheme,
        automaticLayout: true,
        fontSize: 14,
        minimap: {enabled: false},
        lineNumbers: 'on',
        scrollBeyondLastLine: false,
        wordWrap: 'on',
        // Rainbow-colour nested bracket pairs and always underline the match
        // under the cursor, driven by the LanguageConfiguration.brackets above.
        // Vertical bracket-pair guides are intentionally disabled so only the
        // two matching brackets are highlighted, not the entire span between them.
        matchBrackets: 'always',
        bracketPairColorization: { enabled: true, independentColorPoolPerBracketType: true },
        guides: { bracketPairs: false, highlightActiveBracketPair: true }
    });

    // Access ExpresZo UMD
    const {createLanguageService, Parser, SEMANTIC_TOKENS_LEGEND} = window.exprEval || {};
    if (!createLanguageService) {
        console.error('ExpresZo not found. Make sure /dist/bundle.js is built.');
        showError({message: 'ExpresZo library not loaded. Please run: npm run build'}, null);
        return;
    }

    const ls = createLanguageService();

    function toMonacoRange(range) {
        return new monaco.Range(
            range.start.line + 1,
            range.start.character + 1,
            range.end.line + 1,
            range.end.character + 1
        );
    }

    // LSP SymbolKind (1-based) → Monaco SymbolKind (0-based, shifted by -1)
    function toMonacoSymbolKind(lspKind) {
        return Math.max(0, (lspKind ?? 1) - 1);
    }

    // LSP DiagnosticSeverity (Error=1, Warning=2, Info=3, Hint=4) → Monaco MarkerSeverity
    function toMonacoSeverity(lspSeverity) {
        switch (lspSeverity) {
            case 1: return monaco.MarkerSeverity.Error;
            case 2: return monaco.MarkerSeverity.Warning;
            case 3: return monaco.MarkerSeverity.Info;
            case 4: return monaco.MarkerSeverity.Hint;
            default: return monaco.MarkerSeverity.Error;
        }
    }

    // Minimal lsp text document backed by Monaco model
    function makeTextDocument(m) {
        return {
            uri: m.uri.toString(),
            getText: () => m.getValue(),
            positionAt: (offset) => {
                const p = m.getPositionAt(offset);
                return {line: p.lineNumber - 1, character: p.column - 1};
            },
            offsetAt: (pos) => m.getOffsetAt(new monaco.Position(pos.line + 1, pos.character + 1))
        };
    }

    function toLspPosition(mp) {
        return {line: mp.lineNumber - 1, character: mp.column - 1};
    }

    function fromLspPosition(lp) {
        return new monaco.Position(lp.line + 1, lp.character + 1);
    }

    // Get context variables from JSON editor
    function getContextVariables() {
        try {
            const contextText = contextModel.getValue().trim();
            if (!contextText) return {};
            return JSON.parse(contextText);
        } catch (e) {
            return null; // Invalid JSON
        }
    }

    // Completions provider with trigger characters and snippet support
    monaco.languages.registerCompletionItemProvider(languageId, {
        triggerCharacters: ['.'],
        provideCompletionItems: function (model, position) {
            const doc = makeTextDocument(model);
            const variables = getContextVariables() || {};
            const items = ls.getCompletions({
                textDocument: doc,
                position: toLspPosition(position),
                variables
            }) || [];

            function mapKind(k) {
                const map = {
                    3: monaco.languages.CompletionItemKind.Function,
                    6: monaco.languages.CompletionItemKind.Variable,
                    21: monaco.languages.CompletionItemKind.Constant,
                    14: monaco.languages.CompletionItemKind.Keyword
                };
                return map[k] || monaco.languages.CompletionItemKind.Text;
            }

            const suggestions = items.map(it => {
                // Handle textEdit.range if present
                let range;
                if (it.textEdit?.range) {
                    range = new monaco.Range(
                        it.textEdit.range.start.line + 1,
                        it.textEdit.range.start.character + 1,
                        it.textEdit.range.end.line + 1,
                        it.textEdit.range.end.character + 1
                    );
                } else {
                    // Default range - word at position
                    const word = model.getWordUntilPosition(position);
                    range = new monaco.Range(position.lineNumber, word.startColumn, position.lineNumber, word.endColumn);
                }

                return {
                    label: it.label,
                    kind: mapKind(it.kind),
                    detail: it.detail,
                    documentation: it.documentation,
                    insertText: it.textEdit?.newText || it.insertText || it.label,
                    // Add snippet support when insertTextFormat is 2
                    insertTextRules: it.insertTextFormat === 2 
                        ? monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet 
                        : undefined,
                    range
                };
            });

            return {suggestions};
        }
    });

    // Hover provider with MarkupContent support
    monaco.languages.registerHoverProvider(languageId, {
        provideHover: function (model, position) {
            const doc = makeTextDocument(model);
            const variables = getContextVariables() || {};
            const hover = ls.getHover({textDocument: doc, position: toLspPosition(position), variables});
            if (!hover || !hover.contents) return {contents: []};

            // HoverV2 always returns MarkupContent format
            let contents = [];
            if (hover.contents && hover.contents.value) {
                contents = [{value: hover.contents.value}];
            }

            let range = undefined;
            if (hover.range) {
                const start = fromLspPosition(hover.range.start);
                const end = fromLspPosition(hover.range.end);
                range = new monaco.Range(start.lineNumber, start.column, end.lineNumber, end.column);
            }
            return {contents, range};
        }
    });

    // Syntax highlighting
    let highlightDecorations = [];

    function applyHighlighting() {
        const doc = makeTextDocument(expressionModel);
        const tokens = ls.getHighlighting(doc);
        const decorations = tokens.map(t => {
            const start = expressionModel.getPositionAt(t.start);
            const end = expressionModel.getPositionAt(t.end);
            return {
                range: new monaco.Range(start.lineNumber, start.column, end.lineNumber, end.column),
                options: { inlineClassName: 'tok-' + t.type }
            };
        });

        // deltaDecorations replaces old decorations with new ones atomically
        highlightDecorations = expressionEditor.deltaDecorations(highlightDecorations, decorations);
    }

    // Diagnostics — includes parse errors, arity, unknown-ident, and type-mismatch.
    // We stash the raw LSP diagnostics on the model so the code-action provider
    // can surface them later without re-running the pipeline.
    let lastDiagnostics = [];

    function applyDiagnostics() {
        const doc = makeTextDocument(expressionModel);
        const variables = getContextVariables() || {};
        const diagnostics = ls.getDiagnostics({ textDocument: doc, variables });
        lastDiagnostics = diagnostics;

        const markers = diagnostics.map(d => {
            const startPos = fromLspPosition(d.range.start);
            const endPos = fromLspPosition(d.range.end);
            return {
                severity: toMonacoSeverity(d.severity),
                message: d.message,
                startLineNumber: startPos.lineNumber,
                startColumn: startPos.column,
                endLineNumber: endPos.lineNumber,
                endColumn: endPos.column,
                source: d.source || 'expreszo',
                code: typeof d.code === 'string' || typeof d.code === 'number' ? String(d.code) : undefined
            };
        });

        monaco.editor.setModelMarkers(expressionModel, 'expreszo', markers);
    }

    // Signature help — triggers on '(' and ','
    monaco.languages.registerSignatureHelpProvider(languageId, {
        signatureHelpTriggerCharacters: ['(', ','],
        signatureHelpRetriggerCharacters: [','],
        provideSignatureHelp(model, position) {
            const doc = makeTextDocument(model);
            const sig = ls.getSignatureHelp({
                textDocument: doc,
                position: toLspPosition(position)
            });
            if (!sig) return null;
            return {
                value: {
                    signatures: (sig.signatures || []).map(s => ({
                        label: s.label,
                        documentation: s.documentation,
                        parameters: (s.parameters || []).map(p => ({
                            label: p.label,
                            documentation: p.documentation
                        }))
                    })),
                    activeSignature: sig.activeSignature ?? 0,
                    activeParameter: sig.activeParameter ?? 0
                },
                dispose() {}
            };
        }
    });

    // Document symbols — powers the outline view
    monaco.languages.registerDocumentSymbolProvider(languageId, {
        displayName: 'ExpresZo',
        provideDocumentSymbols(model) {
            const doc = makeTextDocument(model);
            const symbols = ls.getDocumentSymbols({ textDocument: doc }) || [];
            const toMonacoSymbol = (s) => ({
                name: s.name,
                detail: s.detail || '',
                kind: toMonacoSymbolKind(s.kind),
                tags: [],
                range: toMonacoRange(s.range),
                selectionRange: toMonacoRange(s.selectionRange),
                children: (s.children || []).map(toMonacoSymbol)
            });
            return symbols.map(toMonacoSymbol);
        }
    });

    // Folding ranges — collapses multi-line case / array / object literals
    monaco.languages.registerFoldingRangeProvider(languageId, {
        provideFoldingRanges(model) {
            const doc = makeTextDocument(model);
            const ranges = ls.getFoldingRanges({ textDocument: doc }) || [];
            return ranges.map(r => ({
                start: r.startLine + 1,
                end: r.endLine + 1,
                kind: monaco.languages.FoldingRangeKind.Region
            }));
        }
    });

    // Go-to-definition — for free variables jumps to the first occurrence;
    // for lambda / function-def parameters jumps to the declaration in the head.
    monaco.languages.registerDefinitionProvider(languageId, {
        provideDefinition(model, position) {
            const doc = makeTextDocument(model);
            const loc = ls.getDefinition({
                textDocument: doc,
                position: toLspPosition(position)
            });
            if (!loc) return null;
            return {
                uri: model.uri,
                range: toMonacoRange(loc.range)
            };
        }
    });

    // Find all references
    monaco.languages.registerReferenceProvider(languageId, {
        provideReferences(model, position) {
            const doc = makeTextDocument(model);
            const locs = ls.getReferences({
                textDocument: doc,
                position: toLspPosition(position)
            }) || [];
            return locs.map(l => ({
                uri: model.uri,
                range: toMonacoRange(l.range)
            }));
        }
    });

    // Semantic tokens — uses the stable legend exported by the language service
    if (SEMANTIC_TOKENS_LEGEND) {
        monaco.languages.registerDocumentSemanticTokensProvider(languageId, {
            getLegend() {
                return {
                    tokenTypes: [...SEMANTIC_TOKENS_LEGEND.tokenTypes],
                    tokenModifiers: [...SEMANTIC_TOKENS_LEGEND.tokenModifiers]
                };
            },
            provideDocumentSemanticTokens(model) {
                const doc = makeTextDocument(model);
                const result = ls.getSemanticTokens({ textDocument: doc });
                return {
                    data: new Uint32Array(result.data),
                    resultId: result.resultId
                };
            },
            releaseDocumentSemanticTokens() {}
        });
    }

    // Code actions — quick fixes for arity-too-few and unknown-ident
    monaco.languages.registerCodeActionProvider(languageId, {
        provideCodeActions(model, range, context) {
            const doc = makeTextDocument(model);
            const variables = getContextVariables() || {};

            const lspRange = {
                start: toLspPosition({ lineNumber: range.startLineNumber, column: range.startColumn }),
                end: toLspPosition({ lineNumber: range.endLineNumber, column: range.endColumn })
            };

            // Only offer actions for diagnostics that overlap the requested range
            const reqStart = doc.offsetAt(lspRange.start);
            const reqEnd = doc.offsetAt(lspRange.end);
            const inRange = lastDiagnostics.filter(d => {
                const ds = doc.offsetAt(d.range.start);
                const de = doc.offsetAt(d.range.end);
                return de >= reqStart && ds <= reqEnd;
            });

            const actions = ls.getCodeActions({
                textDocument: doc,
                range: lspRange,
                context: {
                    diagnostics: inRange,
                    variables
                }
            }) || [];

            const monacoActions = actions.map(a => {
                const edits = [];
                const changes = a.edit?.changes || {};
                for (const uri of Object.keys(changes)) {
                    for (const te of changes[uri]) {
                        edits.push({
                            resource: model.uri,
                            textEdit: {
                                range: toMonacoRange(te.range),
                                text: te.newText
                            },
                            versionId: model.getVersionId()
                        });
                    }
                }
                return {
                    title: a.title,
                    kind: a.kind || 'quickfix',
                    diagnostics: (a.diagnostics || []).map(d => ({
                        severity: toMonacoSeverity(d.severity),
                        message: d.message,
                        startLineNumber: d.range.start.line + 1,
                        startColumn: d.range.start.character + 1,
                        endLineNumber: d.range.end.line + 1,
                        endColumn: d.range.end.character + 1
                    })),
                    edit: { edits },
                    isPreferred: true
                };
            });

            return {
                actions: monacoActions,
                dispose() {}
            };
        }
    });

    // Document formatting — replaces the whole expression with the pretty-printed version
    monaco.languages.registerDocumentFormattingEditProvider(languageId, {
        provideDocumentFormattingEdits(model) {
            const doc = makeTextDocument(model);
            const edits = ls.format({ textDocument: doc }) || [];
            return edits.map(e => ({
                range: toMonacoRange(e.range),
                text: e.newText
            }));
        }
    });

    // Rename provider — F2 or right-click → Rename Symbol.
    // Built-in functions and constants are excluded from renaming since they
    // reference external bindings; user variables and lambda parameters are
    // fully supported, including updating every declaration site.
    monaco.languages.registerRenameProvider(languageId, {
        resolveRenameLocation(model, position) {
            const doc = makeTextDocument(model);
            const range = ls.prepareRename({
                textDocument: doc,
                position: toLspPosition(position)
            });
            if (!range) return { rejectReason: 'This symbol cannot be renamed.' };
            const text = model.getValueInRange(toMonacoRange(range));
            return { range: toMonacoRange(range), text };
        },
        provideRenameEdits(model, position, newName) {
            const doc = makeTextDocument(model);
            const result = ls.rename({
                textDocument: doc,
                position: toLspPosition(position),
                newName
            });
            if (!result) return null;
            const changes = result.changes || {};
            const edits = [];
            for (const uri of Object.keys(changes)) {
                for (const te of changes[uri]) {
                    edits.push({
                        resource: model.uri,
                        textEdit: { range: toMonacoRange(te.range), text: te.newText },
                        versionId: model.getVersionId()
                    });
                }
            }
            return { edits };
        }
    });

    // Inlay hints — parameter name labels before each argument of built-in
    // functions with two or more documented parameters (e.g. pow(base, exp)).
    // Single-argument functions are intentionally excluded to avoid clutter.
    monaco.languages.registerInlayHintsProvider(languageId, {
        provideInlayHints(model, range) {
            const doc = makeTextDocument(model);
            const lspRange = {
                start: { line: range.startLineNumber - 1, character: range.startColumn - 1 },
                end:   { line: range.endLineNumber - 1,   character: range.endColumn - 1 }
            };
            const hints = ls.getInlayHints({ textDocument: doc, range: lspRange }) || [];
            return {
                hints: hints.map(h => ({
                    position: fromLspPosition(h.position),
                    label: typeof h.label === 'string' ? h.label : h.label.map(p => p.value || '').join(''),
                    kind: h.kind,       // 2 = Parameter
                    paddingRight: h.paddingRight
                })),
                dispose() {}
            };
        }
    });

    // Syntax highlight JSON
    function syntaxHighlightJson(json) {
        if (typeof json !== 'string') {
            json = JSON.stringify(json, null, 2);
        }
        json = json.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
        return json.replace(/("+[^"]*"+)(:)?/g, function(match, p1, p2) {
            let cls = 'json-key';
            if (!p2) {
                cls = 'json-string';
            }
            return '<span class="' + cls + '">' + p1 + '</span>' + (p2 || '');
        })
        .replace(/: (true|false)/g, ': <span class="json-boolean">$1</span>')
        .replace(/: (null)/g, ': <span class="json-null">$1</span>')
        .replace(/: (-?\d+\.?\d*)/g, ': <span class="json-number">$1</span>');
    }

    // Result display functions
    function showResult(result) {
        const resultSuccess = document.getElementById('resultSuccess');
        const resultError = document.getElementById('resultError');
        const resultEmpty = document.getElementById('resultEmpty');
        const resultValue = document.getElementById('resultValue');
        const resultType = document.getElementById('resultType');

        resultSuccess.classList.remove('hidden');
        resultError.classList.add('hidden');
        resultEmpty.classList.add('hidden');

        // Format the result
        let displayValue;
        let typeInfo;
        let isJson = false;
        
        if (result === null) {
            displayValue = '<span class="json-null">null</span>';
            typeInfo = 'Type: null';
            isJson = true;
        } else if (result === undefined) {
            displayValue = '<span class="json-null">undefined</span>';
            typeInfo = 'Type: undefined';
            isJson = true;
        } else if (typeof result === 'object') {
            displayValue = syntaxHighlightJson(result);
            typeInfo = Array.isArray(result) ? `Type: array (${result.length} items)` : 'Type: object';
            isJson = true;
        } else if (typeof result === 'boolean') {
            displayValue = `<span class="json-boolean">${result}</span>`;
            typeInfo = 'Type: boolean';
            isJson = true;
        } else if (typeof result === 'number') {
            displayValue = `<span class="json-number">${result}</span>`;
            typeInfo = 'Type: number';
            isJson = true;
        } else if (typeof result === 'string') {
            displayValue = `<span class="json-string">"${result}"</span>`;
            typeInfo = 'Type: string';
            isJson = true;
        } else {
            displayValue = String(result);
            typeInfo = `Type: ${typeof result}`;
        }

        if (isJson) {
            resultValue.innerHTML = displayValue;
        } else {
            resultValue.textContent = displayValue;
        }
        resultType.textContent = typeInfo;
    }

    function showError(error, contextError) {
        const resultSuccess = document.getElementById('resultSuccess');
        const resultError = document.getElementById('resultError');
        const resultEmpty = document.getElementById('resultEmpty');
        const errorMessage = document.getElementById('errorMessage');
        const errorDetails = document.getElementById('errorDetails');
        const resultsPane = document.getElementById('resultsPane');

        resultSuccess.classList.add('hidden');
        resultError.classList.remove('hidden');
        resultEmpty.classList.add('hidden');

        // Shake animation
        if (resultsPane) {
            resultsPane.classList.add('error-shake');
            setTimeout(() => resultsPane.classList.remove('error-shake'), 300);
        }

        errorMessage.textContent = error.message;

        // Build helpful error details
        let details = [];

        if (contextError) {
            details.push(`<div class="p-2 bg-amber-50 dark:bg-amber-900/20 rounded border border-amber-200 dark:border-amber-800">
                <p class="font-medium text-amber-700 dark:text-amber-400">⚠️ JSON Context Error</p>
                <p class="text-amber-600 dark:text-amber-300 text-sm mt-1">${contextError}</p>
            </div>`);
        }

        // Parse error for more context
        const undefinedMatch = error.message.match(/undefined variable[:\s]*(\w+)/i);
        if (undefinedMatch) {
            const varName = undefinedMatch[1];
            const contextVars = getContextVariables();
            const availableVars = contextVars ? Object.keys(contextVars) : [];
            details.push(`<div class="p-2 bg-blue-50 dark:bg-blue-900/20 rounded border border-blue-200 dark:border-blue-800">
                <p class="font-medium text-blue-700 dark:text-blue-400">💡 Suggestion</p>
                <p class="text-blue-600 dark:text-blue-300 text-sm mt-1">The variable <code class="bg-blue-100 dark:bg-blue-800 px-1 rounded">${varName}</code> is not defined in your context.</p>
                ${availableVars.length > 0 ?
                    `<p class="text-blue-600 dark:text-blue-300 text-sm mt-1">Available variables: <code class="bg-blue-100 dark:bg-blue-800 px-1 rounded">${availableVars.join('</code>, <code class="bg-blue-100 dark:bg-blue-800 px-1 rounded">')}</code></p>` :
                    '<p class="text-blue-600 dark:text-blue-300 text-sm mt-1">Add variables to the JSON context on the left.</p>'}
            </div>`);
        }

        const syntaxMatch = error.message.match(/parse error|unexpected|expected/i);
        if (syntaxMatch) {
            details.push(`<div class="p-2 bg-purple-50 dark:bg-purple-900/20 rounded border border-purple-200 dark:border-purple-800">
                <p class="font-medium text-purple-700 dark:text-purple-400">🔍 Syntax Help</p>
                <p class="text-purple-600 dark:text-purple-300 text-sm mt-1">Check for missing parentheses, brackets, or operators.</p>
            </div>`);
        }

        if (error.message.includes('is not a function')) {
            details.push(`<div class="p-2 bg-orange-50 dark:bg-orange-900/20 rounded border border-orange-200 dark:border-orange-800">
                <p class="font-medium text-orange-700 dark:text-orange-400">📚 Function Help</p>
                <p class="text-orange-600 dark:text-orange-300 text-sm mt-1">Make sure you're using a valid built-in function. Try <code class="bg-orange-100 dark:bg-orange-800 px-1 rounded">sum</code>, <code class="bg-orange-100 dark:bg-orange-800 px-1 rounded">max</code>, <code class="bg-orange-100 dark:bg-orange-800 px-1 rounded">min</code>, <code class="bg-orange-100 dark:bg-orange-800 px-1 rounded">abs</code>, etc.</p>
            </div>`);
        }

        errorDetails.innerHTML = details.join('');
    }

    function showEmpty() {
        document.getElementById('resultSuccess').classList.add('hidden');
        document.getElementById('resultError').classList.add('hidden');
        document.getElementById('resultEmpty').classList.remove('hidden');
    }

    // Evaluation function
    function evaluate() {
        const expression = expressionModel.getValue().trim();

        if (!expression) {
            showEmpty();
            return;
        }

        const contextVars = getContextVariables();
        let contextError = null;

        if (contextVars === null) {
            contextError = 'Invalid JSON in context editor. Please fix the JSON syntax.';
        }

        try {
            const parser = new Parser({ legacy: legacyMode });
            const evaluationResult = parser.evaluate(expression, contextVars || {});
            showResult(evaluationResult);
        } catch (error) {
            showError(error, contextError);
        }
    }

    legacyToggle.addEventListener('change', () => {
        legacyMode = legacyToggle.checked;
        localStorage.setItem('expreszo-legacy', String(legacyMode));
        evaluate();
    });

    // Format button — triggers Monaco's format-document action, which fans out
    // to the registered DocumentFormattingEditProvider above.
    document.getElementById('formatBtn').addEventListener('click', () => {
        expressionEditor.focus();
        expressionEditor.getAction('editor.action.formatDocument')?.run();
    });

    // Save functionality
    document.getElementById('saveBtn').addEventListener('click', () => {
        localStorage.setItem('expreszo-expression', expressionModel.getValue());
        localStorage.setItem('expreszo-context', contextModel.getValue());

        // Show toast
        const toast = document.getElementById('saveToast');
        toast.classList.remove('translate-y-20', 'opacity-0');
        setTimeout(() => {
            toast.classList.add('translate-y-20', 'opacity-0');
        }, 2000);
    });

    // Event listeners for changes
    expressionModel.onDidChangeContent(() => {
        applyHighlighting();
        applyDiagnostics();
        evaluate();
    });

    contextModel.onDidChangeContent(() => {
        applyDiagnostics();
        evaluate();
    });

    // Initialize - apply highlighting and evaluate for initial content
    applyHighlighting();
    evaluate();

    // Load example from URL query parameter if present (after event handlers are set up)
    loadExampleFromUrl();
});
