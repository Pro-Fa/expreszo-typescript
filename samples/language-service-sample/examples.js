// Example cases for the language service sample
const exampleCases = [
    {
        id: 'math',
        title: 'Mathematical Expression',
        description: 'Basic math operations with variables',
        expression: '(x + y) * multiplier + sqrt(16)',
        context: {
            x: 10,
            y: 5,
            multiplier: 3
        }
    },
    {
        id: 'arrays',
        title: 'Working with Arrays',
        description: 'Array functions like sum, min, max',
        expression: 'sum(numbers) + max(numbers) - min(numbers)',
        context: {
            numbers: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
            values: [15, 25, 35]
        }
    },
    {
        id: 'objects',
        title: 'Object Manipulation',
        description: 'Access nested object properties',
        expression: 'user.profile.score * level.multiplier + bonus.points',
        context: {
            user: {
                name: "Alice",
                profile: {
                    score: 85,
                    rank: "Gold"
                }
            },
            level: {
                current: 5,
                multiplier: 1.5
            },
            bonus: {
                points: 100,
                active: true
            }
        }
    },
    {
        id: 'map-filter',
        title: 'Map and Filter Functions',
        description: 'Transform and filter data with callbacks',
        expression: 'sum(\n  map(\n    filter(\n      items,\n      f(i) = i > threshold\n    ),\n    f(x) = x * 2\n  )\n) / length(items)',
        context: {
            items: [1, 2, 3, 4, 5, 6, 7, 8],
            threshold: 3
        }
    },
    {
        id: 'complex',
        title: 'Complex Objects',
        description: 'Work with deeply nested data structures',
        expression: 'length(company.departments[0].employees) * company.settings.bonusRate + sum(map(company.departments, f(d) = d.budget))',
        context: {
            company: {
                name: "TechCorp",
                departments: [
                    {
                        name: "Engineering",
                        budget: 500000,
                        employees: ["John", "Jane", "Bob"]
                    },
                    {
                        name: "Marketing",
                        budget: 200000,
                        employees: ["Alice", "Carol"]
                    }
                ],
                settings: {
                    bonusRate: 0.15,
                    fiscalYear: 2024
                }
            }
        }
    },
    {
        id: 'data-transform',
        title: 'Data Transformation',
        description: 'Flatten nested objects and transform rows',
        expression: "map($event, f(row) = {_id: row.rowId, ...flatten(row.data, '')})",
        context: {
            "$event": [
                {"rowId": 1, "state": "saved", "data": { "InventoryId": 1256, "Description": "Bal", "Weight": { "Unit": "g", "Amount": 120 } }},
                {"rowId": 2, "state": "new", "data": { "InventoryId": 2344, "Description": "Basket", "Weight": { "Unit": "g", "Amount": 300 } }},
                {"rowId": 3, "state": "unchanged", "data": { "InventoryId": 9362, "Description": "Wood", "Weight": { "Unit": "kg", "Amount": 18 } }}
            ]
        }
    },
    {
        id: 'folding-demo',
        title: 'Folding Ranges Demo',
        description: 'Multi-line case, array, and object literals produce folds',
        expression: 'case\n  when score >= thresholds.gold then {\n    tier: "gold",\n    perks: [\n      "priority support",\n      "free shipping",\n      "early access"\n    ]\n  }\n  when score >= thresholds.silver then {\n    tier: "silver",\n    perks: [\n      "free shipping",\n      "monthly newsletter"\n    ]\n  }\n  else {\n    tier: "bronze",\n    perks: [\n      "monthly newsletter"\n    ]\n  }\nend',
        context: {
            score: 85,
            thresholds: {
                gold: 90,
                silver: 75
            }
        }
    },
    {
        id: 'diagnostics-demo',
        title: 'Diagnostics Demo',
        description: 'Arity, type-mismatch, and unknown-identifier diagnostics. Hover squiggles and click the lightbulb for quick fixes.',
        expression: '// pow() needs 2 args           -> arity-too-few\n// random() accepts 0-1 args    -> arity-too-many\n// pow expects numbers          -> type-mismatch\n// lenght is a typo             -> unknown-ident quickfix\npow(2) + random(1, 2, 3) + pow([1, 2], 2) + lenght(numbers)',
        context: {
            numbers: [1, 2, 3, 4, 5]
        }
    },
    {
        id: 'legacy-mode',
        title: 'Legacy vs Modern Mode',
        description: 'Toggle "Legacy mode" in the header. Modern mode coerces mixed types in string concatenation ("Score: " + 85 -> "Score: 85"); legacy mode requires both sides to be strings and returns undefined otherwise. Comparisons behave similarly with undefined operands.',
        expression: '"Score: " + score + " (passed: " + (score > threshold) + ")"',
        context: {
            score: 85,
            threshold: 60
        }
    },
    {
        id: 'formatter-signatures',
        title: 'Formatter & Signature Help',
        description: 'Click Format to pretty-print this compressed expression. Place the cursor inside any call to see nested signature help.',
        expression: 'sum(map(filter(items,f(i)=i>threshold),f(x)=pow(x,2)))+max(map(items,f(i)=sqrt(i)))',
        context: {
            items: [1, 2, 3, 4, 5, 6, 7, 8],
            threshold: 3
        }
    },
    {
        id: 'inlay-hints',
        title: 'Inlay Hints',
        description: 'Parameter-name labels appear before each argument of multi-parameter built-in functions. Hover the greyed labels to see the parameter description.',
        expression: "// pow, log, clamp, and padStart all have named params\npow(base, exp) + log(value, base) + clamp(score, minVal, maxVal) + padStart(label, 10, '0')",
        context: {
            base: 2,
            exp: 8,
            value: 100,
            score: 75,
            minVal: 0,
            maxVal: 100,
            label: 'item'
        }
    },
    {
        id: 'rename-lambda',
        title: 'Rename Symbol',
        description: 'Press F2 (or right-click → Rename Symbol) on any variable or lambda parameter to rename all its occurrences at once. Built-in names like sin or PI are excluded. Try renaming "x" inside the map callback.',
        expression: "// Select 'x' inside the lambda body and press F2\nsum(map(items, f(x) = pow(x, 2))) + reduce(items, f(acc, x) = acc + x, 0)",
        context: {
            items: [1, 2, 3, 4, 5]
        }
    },
    {
        id: 'regex-network',
        title: 'Regex & IP Range Functions',
        description: 'Match, extract, and replace with regular expressions, plus an IPv4 CIDR range check. Note: write backslash classes as "\\\\d" in the source — character classes like "[0-9]" need no escaping.',
        expression: '{\n  validEmail: regexMatches(email, "^[^@]+@[^@]+[.][a-z]+$"),\n  domain: regexExtract(email, "@(.+)$"),\n  maskedPhone: regexReplace(phone, "[0-9]", "*"),\n  isInternalIp: ipInRange(clientIp, "10.0.0.0/8")\n}',
        context: {
            email: 'alice@example.com',
            phone: '555-123-4567',
            clientIp: '10.42.1.7'
        }
    },
    {
        id: 'from-json',
        title: 'Parse JSON Strings',
        description: 'Parse a JSON payload with fromJson, falling back to a default when the input is not valid JSON.',
        expression: '{\n  order: fromJson(payload),\n  total: sum(map((fromJson(payload)).lines, l => l.qty * l.price)),\n  settings: fromJson(rawSettings, { theme: "light" })\n}',
        context: {
            payload: '{"id": 7, "lines": [{"qty": 2, "price": 4.5}, {"qty": 1, "price": 10}]}',
            rawSettings: 'not json'
        }
    },
    {
        id: 'datetime-format',
        title: 'Format a future date',
        description: 'Add 7 days to today and render as yyyy-MM-dd. Requires the Date/Time plugin.',
        expression: "format(addDuration(today(), 7, 'days'), 'yyyy-MM-dd')",
        context: {},
        requiresDateTime: true
    },
    {
        id: 'datetime-relative',
        title: 'Days until a deadline',
        description: 'Compute how many whole days separate today from a deadline. Requires the Date/Time plugin.',
        expression: 'daysUntil(deadline)',
        context: {
            deadline: '2026-12-25'
        },
        requiresDateTime: true
    },
    {
        id: 'datetime-business',
        title: 'Business days in a range',
        description: 'Count Mon–Fri days between two ISO dates. Requires the Date/Time plugin.',
        expression: "businessDaysBetween(rangeStart, rangeEnd)",
        context: {
            rangeStart: '2026-05-01',
            rangeEnd: '2026-06-01'
        },
        requiresDateTime: true
    }
];
