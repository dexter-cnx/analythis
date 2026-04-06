# analythis

`analythis` is a framework-agnostic repository analysis engine.

It inspects a local repository or a Git URL, infers structure and architecture, detects modules, entities, APIs, risks, and reusable foundations, then exports a machine-readable blueprint and human-readable markdown reports.

## Features

- Analyze local folders or clone a Git repository temporarily
- Generate `.analythis/inventory.json`
- Generate `.analythis/blueprint.json`
- Export markdown blueprint pack
- Export YAML from blueprint JSON
- Heuristic support for web, backend, mobile, library, and monorepo profiles
- Prompt-pack generation for refactoring, regeneration, core extraction, and onboarding

## Install

```bash
npm install
npm run build
npm link
```

After linking, the `analythis` command is available globally.

## Quick start

Analyze the current repo:

```bash
analythis analyze .
```

Analyze with a profile and custom output dir:

```bash
analythis analyze . --profile backend --output ./out --format both
```

Inspect only:

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

## Output layout

By default, `analythis analyze .` creates:

```text
.analythis/
  inventory.json
  blueprint.json
  prompt-pack.json
  reports/
    inventory.md
    module-report.md
    dependency-report.md
  blueprint/
    system-overview.md
    domain-map.md
    architecture-rules.md
    api-surfaces.md
    risks-and-gaps.md
    next-prompts.md
```

## Supported commands

### `analythis analyze <path-or-url>`

Options:

- `--profile <name>`: `generic | web | backend | mobile | monorepo | library`
- `--focus <items>`: comma-separated focus areas such as `auth,billing,queue`
- `--output <dir>`: output directory, default `.analythis`
- `--format <type>`: `json | md | both`, default `both`
- `--branch <name>`: Git branch for remote repos
- `--shallow`: faster, lighter analysis
- `--verbose`: log more details

### `analythis inspect <path-or-url>`

Creates only `inventory.json` and `reports/inventory.md`.

### `analythis export <blueprint-json>`

Options:

- `--to <type>`: `md | yaml`, default `md`
- `--output <dir>`: output directory, default `.analythis-export`

## Design notes

`analythis` is intentionally heuristic in v1.0. It aims to provide useful, structured context quickly rather than perfect semantic understanding. The blueprint is safe to feed into coding agents, refactor planners, or onboarding documentation workflows.

## Development

```bash
npm install
npm run build
npm run dev -- analyze .
```

## Roadmap ideas

- import graph visualization
- richer semantic code summarization
- comparative repo analysis
- pluggable LLM deep-synthesis mode
- web dashboard
