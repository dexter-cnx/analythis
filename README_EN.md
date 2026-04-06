# @dextercnx/analythis

[🇹🇭 ภาษาไทย](README.md)

`analythis` is a framework-agnostic repository analysis engine.

It inspects a local repository or a Git URL, automatically detects the repository profile, infers structure and architecture, runs a structured rule engine, and exports a machine-readable blueprint and human-readable markdown reports.

## Features

- Analyze local folders or clone a Git repository temporarily
- **Automatic profile detection** with confidence scoring and reasons
- **Structured rule engine** — 10 architectural rules across 4 groups
- **Import graph visualization** — parse imports and export as JSON, Mermaid, and Graphviz DOT
- **Semantic code summarization** — extract exported symbols and infer domain responsibilities per module
- **Multi-repo comparison** — analyze N repositories and diff their blueprints side-by-side
- Generate `.analythis/inventory.json` and `.analythis/blueprint.json`
- Export markdown blueprint pack with severity-ranked findings
- Export YAML from blueprint JSON
- Prompt-pack generation for refactoring, regeneration, core extraction, and onboarding

## Install

```bash
npm install -g @dextercnx/analythis
```

After installing, the `analythis` command is available globally.

## Quick start

Analyze the current repo:

```bash
analythis analyze .
```

Analyze with a profile hint and custom output dir:

```bash
analythis analyze . --profile backend --output ./out --format both
```

Inspect structure only (no full analysis):

```bash
analythis inspect .
```

Export an existing blueprint to markdown:

```bash
analythis export ./.analythis/blueprint.json --to md
```

Export an existing blueprint to YAML:

```bash
analythis export ./.analythis/blueprint.json --to yaml
```

Analyze a Git URL:

```bash
analythis analyze https://github.com/user/repo.git
```

Generate import graph alongside analysis:

```bash
analythis analyze . --graph
```

Generate import graph standalone:

```bash
analythis graph .
```

Compare two or more repositories:

```bash
analythis compare ./repo-a ./repo-b
analythis compare ./repo-a ./repo-b ./repo-c --format md --output ./out
```

## Profile detection

`analythis` automatically detects the repository profile by scoring structural signals — no manual flag required. The `--profile` flag acts as a **hint** that boosts the named profile when scores are tied.

### Supported profiles

| Profile | Key signals |
| --- | --- |
| `generic` | Fallback — applies when no other profile clears the threshold |
| `web` | next.config, vite.config, tailwind.config, components/, pages/ |
| `backend` | server.ts entry, routes/, controllers/, Dockerfile, DB manifests |
| `mobile` | pubspec.yaml, Dart, android/, ios/, lib/ |
| `monorepo` | packages/, apps/, melos.yaml, lerna.json, turbo.json, pnpm-workspace.yaml |
| `library` | lib/, examples/, Cargo.toml, index entry, types/ |

### Detection result in blueprint

```json
"detected_profiles": {
  "primary": "backend",
  "primaryConfidence": 0.68,
  "primaryReasons": [
    "Has server entry point (server.ts, server.js, app.ts)",
    "Framework hint: Node backend detected",
    "Has routes/ or controllers/ directory"
  ],
  "secondary": ["library"]
}
```

## Rule engine

After profiling, `analythis` runs 10 structural rules and includes findings in the blueprint.

| Rule | Group | Severity |
| --- | --- | --- |
| Cyclic module dependencies | dependency | high |
| High module coupling | dependency | medium |
| Missing layer boundary rules | dependency + architecture | medium |
| Missing service/use-case layer | architecture | high |
| Domain entities exposed via API (DTO leak) | architecture | medium |
| Mixed UI and data concerns | architecture | medium |
| Deeply nested module paths | structure | low |
| Oversized shared/utils module | structure | medium |
| Configuration scatter | cross-cutting | low |
| Auth logic scatter | cross-cutting | high |

Rules restricted to specific profiles (e.g. `missing-service-layer` only runs on `backend`) are skipped automatically.

Findings are surfaced in `blueprint.rule_findings` (structured) and merged into `risks` and `refactor_opportunities` (string lists) for backward compatibility.

## Import graph (v1.1)

`analythis graph .` parses import statements from TypeScript, JavaScript, Python, and Dart source files and exports three formats:

| File | Format | Use |
| --- | --- | --- |
| `graph.json` | Structured JSON | Programmatic consumption, CI pipelines |
| `graph.mmd` | Mermaid flowchart | Render directly in GitHub README or Notion |
| `graph.dot` | Graphviz DOT | Generate PNG/SVG with `dot -Tpng graph.dot -o graph.png` |

The graph distinguishes **internal** edges (relative or package-relative imports) from **external** edges (npm packages, stdlib modules, etc.).

```bash
analythis graph .
analythis graph . --output ./reports --shallow
analythis analyze . --graph        # generates graph alongside full analysis
```

## Semantic code summarization (v1.2)

During analysis, each module is enriched with semantic data extracted from its source files without requiring an LLM:

- **`exports`** — public symbols found via regex (`export function`, `export class`, `export interface`, etc.)
- **`responsibilities`** — domain labels inferred by matching identifier names against a 16-category keyword dictionary (Authentication, Billing, Notifications, RBAC, Data access, API layer, …)
- **`summary`** — a one-line human-readable description combining responsibilities and top exports

These fields appear in `blueprint.json` under each module and in `reports/module-report.md`.

```json
{
  "name": "src",
  "purpose": "Primary source code.",
  "summary": "Handles Authentication, Data access. Exports UserService, AuthGuard, TokenRepository and 12 more.",
  "exports": ["UserService", "AuthGuard", "TokenRepository", "..."],
  "responsibilities": ["Authentication", "Data access", "Authorization & RBAC"]
}
```

## Multi-repo comparison (v1.3)

`analythis compare` runs full analysis on each repository and produces a structured diff.

```bash
analythis compare ./repo-a ./repo-b
analythis compare https://github.com/a/x.git https://github.com/b/y.git --format both
```

Output:

| File | Content |
| --- | --- |
| `comparison.json` | Structured diff — profiles, architecture styles, module names, risk counts |
| `comparison.md` | Human-readable report with summary table, divergence flags, per-repo findings, and recommendation |

The comparison report highlights:

- **Profile mismatch** — whether repos use different detected profiles
- **Architecture mismatch** — diverging style (service-oriented vs feature-first, etc.)
- **Shared characteristics** — common architecture patterns and risks across all repos
- **Unique characteristics** — what each repo has that others don't
- **Recommendation** — actionable summary for integration or alignment

## Output layout

`analythis analyze .` creates:

```text
.analythis/
  inventory.json
  blueprint.json          ← includes detected_profiles + rule_findings + module semantics
  prompt-pack.json
  graph.json              ← import graph (when --graph is used)
  graph.mmd               ← Mermaid diagram
  graph.dot               ← Graphviz DOT
  reports/
    inventory.md
    module-report.md      ← includes exports + responsibilities per module
    dependency-report.md
  blueprint/
    system-overview.md    ← profile confidence + detection reasons
    domain-map.md
    architecture-rules.md ← detected violations with suggestions
    api-surfaces.md
    risks-and-gaps.md     ← rule findings grouped by severity
    next-prompts.md
  prompts/
    refactor.md
    regenerate.md
    extract_core.md
    onboard_team.md
```

`analythis compare` creates:

```text
.analythis-compare/
  comparison.json
  comparison.md
```

## Supported commands

### `analythis analyze <path-or-url>`

Options:

- `--profile <name>`: hint to boost a profile — `generic | web | backend | mobile | monorepo | library`
- `--focus <items>`: comma-separated focus areas, e.g. `auth,billing,queue`
- `--output <dir>`: output directory, default `.analythis`
- `--format <type>`: `json | md | both`, default `both`
- `--branch <name>`: Git branch for remote repos
- `--shallow`: faster, lighter analysis
- `--verbose`: log more details
- `--graph`: also generate import graph (`graph.json`, `graph.mmd`, `graph.dot`)

### `analythis graph <path-or-url>`

Standalone import graph generation. No full analysis.

Options:

- `--output <dir>`: output directory, default `.analythis`
- `--branch <name>`: Git branch for remote repos
- `--shallow`: faster, lighter analysis

### `analythis inspect <path-or-url>`

Creates only `inventory.json` and `reports/inventory.md`. No analysis or rule engine.

### `analythis compare <path-or-url...>`

Analyzes two or more repositories and outputs a comparison report.

Options:

- `--output <dir>`: output directory, default `.analythis-compare`
- `--format <type>`: `json | md | both`, default `both`
- `--branch <name>`: Git branch for remote repos
- `--shallow`: faster, lighter analysis

### `analythis export <blueprint-json>`

Options:

- `--to <type>`: `md | yaml`, default `md`
- `--output <dir>`: output directory, default `.analythis-export`

## Architecture

```text
src/
  profiles/         ← profile definitions, registry, detector
  rules/            ← rule engine + 10 rules (dependency / architecture / structure / cross-cutting)
  core/
    engine/         ← analyzer pipeline, comparator
    types/          ← Blueprint, Inventory, options
  inspectors/       ← inventory, architecture, domain, interface, manifest, risk,
                       import-graph, semantic
  exporters/        ← markdown, yaml, graph, comparison
  intake/           ← local path + git clone resolution
  cli/              ← commander CLI
```

### Extending profiles

Register a custom profile at runtime without forking:

```typescript
import { registerProfile } from '@dextercnx/analythis/profiles';

registerProfile({
  id: 'data-pipeline',
  title: 'Data Pipeline',
  description: 'Batch or streaming data processing repository.',
  signals: [
    { id: 'dp:airflow', description: 'Has Airflow DAGs', weight: 10, test: inv => inv.topLevelDirs.includes('dags') },
    { id: 'dp:spark',   description: 'Has Spark jobs',   weight: 8,  test: inv => inv.topLevelDirs.includes('jobs') }
  ],
  inspectors: ['inventory', 'manifest', 'risk'],
  ruleGroups: ['structure', 'cross-cutting'],
  heuristicStrategies: ['directory-pattern'],
  weights: {}
});
```

### Adding a rule

Implement `AnalysisRule` and add it to `allRules` in `src/rules/index.ts`:

```typescript
import type { AnalysisRule } from './types';

export const myRule: AnalysisRule = {
  id: 'cross/my-check',
  title: 'My Custom Check',
  description: 'Detects ...',
  severity: 'medium',
  ruleGroups: ['cross-cutting'],
  profiles: [],   // empty = all profiles
  enabled: true,
  evaluate({ inventory, blueprint, profileResult }) {
    // return RuleResult[]
    return [];
  }
};
```

## Design notes

`analythis` is intentionally heuristic. Detection is deterministic and explainable — every confidence score comes with the list of signals that fired. The blueprint is safe to feed into coding agents, refactor planners, or onboarding documentation workflows.

## Development

```bash
npm install
npm run build
npm test
npm run dev -- analyze .
```

## Roadmap

| Version | Feature | Status |
| --- | --- | --- |
| v1.1 | Import graph visualization | ✅ Done |
| v1.2 | Semantic code summarization | ✅ Done |
| v1.3 | Multi-repo comparison | ✅ Done |
| v2.0 | Pluggable LLM deep-synthesis mode | Planned |
| v2.1 | Web dashboard | Planned |
