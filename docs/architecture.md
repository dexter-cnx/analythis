# analythis Architecture

`analythis` runs a simple six-step pipeline:

1. Intake: resolve local path or clone a Git URL.
2. Inventory: inspect file tree, manifests, entry points, tests, CI, and infrastructure.
3. Inference: infer architecture style, modules, entities, use cases, APIs, events, and dependencies.
4. Assessment: detect risks and refactor opportunities.
5. Synthesis: build a normalized blueprint and prompt pack.
6. Export: write JSON, markdown, and optional YAML output.

This v1.0 release is heuristic and deterministic. It is intentionally light-weight and does not require an LLM.
