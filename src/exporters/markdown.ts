import * as path from 'path';
import type { Blueprint, PromptPack } from '../core/types/blueprint';
import type { Inventory } from '../core/types/inventory';
import { ensureDir, writeText } from '../utils';

export function exportInventoryMarkdown(inventory: Inventory, outputDir: string): void {
  const md = [
    `# Inventory: ${inventory.repoName}`,
    '',
    `- Repo root: \`${inventory.repoRoot}\``,
    `- Repo type: **${inventory.repoType}**`,
    `- Languages: ${inventory.languages.join(', ') || 'Unknown'}`,
    `- Framework hints: ${inventory.frameworkHints.join(', ') || 'None'}`,
    `- Package managers: ${inventory.packageManagers.join(', ') || 'Unknown'}`,
    '',
    '## Top-level directories',
    '',
    ...inventory.topLevelDirs.map((d) => `- ${d}`),
    '',
    '## Root files',
    '',
    ...inventory.rootFiles.map((f) => `- ${f}`),
    '',
    '## Entry points',
    '',
    ...(inventory.entryPoints.length ? inventory.entryPoints.map((f) => `- ${f}`) : ['- None detected']),
    '',
    '## Test locations',
    '',
    ...(inventory.testLocations.length ? inventory.testLocations.map((f) => `- ${f}`) : ['- None detected'])
  ].join('\n');

  writeText(path.join(outputDir, 'reports', 'inventory.md'), md);
}

export function exportBlueprintMarkdown(blueprint: Blueprint, outputDir: string): void {
  ensureDir(path.join(outputDir, 'blueprint'));

  writeText(path.join(outputDir, 'blueprint', 'system-overview.md'), buildSystemOverview(blueprint));
  writeText(path.join(outputDir, 'blueprint', 'domain-map.md'), buildDomainMap(blueprint));
  writeText(path.join(outputDir, 'blueprint', 'architecture-rules.md'), buildArchitectureRules(blueprint));
  writeText(path.join(outputDir, 'blueprint', 'api-surfaces.md'), buildApiSurfaces(blueprint));
  writeText(path.join(outputDir, 'blueprint', 'risks-and-gaps.md'), buildRisksAndGaps(blueprint));
  writeText(path.join(outputDir, 'blueprint', 'next-prompts.md'), buildNextPrompts(blueprint));
  writeText(path.join(outputDir, 'reports', 'module-report.md'), buildModuleReport(blueprint));
  writeText(path.join(outputDir, 'reports', 'dependency-report.md'), buildDependencyReport(blueprint));
}

export function exportPromptPackMarkdown(promptPack: PromptPack, outputDir: string): void {
  ensureDir(path.join(outputDir, 'prompts'));
  for (const [name, content] of Object.entries(promptPack)) {
    writeText(path.join(outputDir, 'prompts', `${name}.md`), `${content}\n`);
  }
}

function buildSystemOverview(blueprint: Blueprint): string {
  return `# System Overview\n\n${blueprint.summary}\n\n## Repository Type\n\n- ${blueprint.repo_type}\n\n## Architecture Style\n\n${blueprint.architecture.style.map((v) => `- ${v}`).join('\n') || '- Unknown'}\n\n## Modules\n\n${blueprint.modules.map((m) => `- **${m.name}**: ${m.purpose}`).join('\n')}\n\n## Reusable Foundations\n\n${blueprint.reusable_foundations.map((v) => `- ${v}`).join('\n') || '- None inferred'}\n`;
}

function buildDomainMap(blueprint: Blueprint): string {
  return `# Domain Map\n\n## Entities\n\n${blueprint.entities.map((e) => `### ${e.name}\n- Description: ${e.description}\n- Fields: ${e.fields.join(', ') || 'None inferred'}\n- Rules:\n${e.rules.map((r) => `  - ${r}`).join('\n') || '  - None inferred'}`).join('\n\n') || 'No entities inferred.'}\n\n## Use Cases\n\n${blueprint.use_cases.map((u) => `### ${u.name}\n- Actors: ${u.actors.join(', ') || 'Unknown'}\n- Steps:\n${u.steps.map((s) => `  - ${s}`).join('\n')}\n- Related Entities: ${u.relatedEntities.join(', ') || 'None'}`).join('\n\n') || 'No use cases inferred.'}`;
}

function buildArchitectureRules(blueprint: Blueprint): string {
  const rules = [
    ...blueprint.architecture.dependency_rules,
    'Keep configuration explicit and environment-aware.',
    'Preserve module boundaries when adding new features.',
    'Prefer reusable foundations over app-specific shortcuts.'
  ];
  return `# Architecture Rules\n\n${rules.map((r) => `- ${r}`).join('\n')}`;
}

function buildApiSurfaces(blueprint: Blueprint): string {
  return `# API Surfaces\n\n${blueprint.api_surfaces.map((a) => `- **${a.type}** — ${a.name}: ${a.details}`).join('\n')}\n\n## Events\n\n${blueprint.events.map((e) => `- ${e}`).join('\n') || '- None inferred'}`;
}

function buildRisksAndGaps(blueprint: Blueprint): string {
  return `# Risks and Gaps\n\n## Risks\n\n${blueprint.risks.map((r) => `- ${r}`).join('\n') || '- None inferred'}\n\n## Refactor Opportunities\n\n${blueprint.refactor_opportunities.map((r) => `- ${r}`).join('\n') || '- None inferred'}\n\n## Open Questions\n\n${blueprint.open_questions.map((q) => `- ${q}`).join('\n') || '- None inferred'}`;
}

function buildNextPrompts(blueprint: Blueprint): string {
  return `# Next Prompts\n\n- Refactor: Read \`.analythis/blueprint.json\` and refactor the codebase to align with the inferred architecture.\n- Regenerate: Generate a clean starter preserving reusable foundations and external interfaces.\n- Extract Core: Separate reusable business or platform primitives from app-specific logic.\n- Onboarding: Create a contributor guide from the blueprint.\n`;
}

function buildModuleReport(blueprint: Blueprint): string {
  return `# Module Report\n\n${blueprint.modules.map((m) => `## ${m.name}\n- Purpose: ${m.purpose}\n- Paths: ${m.paths.join(', ')}\n- Depends on: ${m.dependsOn.join(', ') || 'None inferred'}`).join('\n\n')}`;
}

function buildDependencyReport(blueprint: Blueprint): string {
  return `# Dependency Report\n\n${blueprint.dependencies.map((d) => `- **${d.name}** (${d.critical ? 'critical' : 'supporting'}): ${d.purpose}`).join('\n') || '- No dependencies inferred'}`;
}
