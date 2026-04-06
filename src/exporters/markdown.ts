import * as path from 'path';
import type { Blueprint, PromptPack } from '../core/types/blueprint';
import type { Inventory } from '../core/types/inventory';
import type { RuleResult, RiskSeverity } from '../rules/types';
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
    ...(inventory.entryPoints.length ? inventory.entryPoints.map((f) => `- \`${f}\``) : ['- None detected']),
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

// ---------------------------------------------------------------------------
// Section builders
// ---------------------------------------------------------------------------

function buildSystemOverview(blueprint: Blueprint): string {
  const { detected_profiles } = blueprint;
  const confidencePct = Math.round(detected_profiles.primaryConfidence * 100);
  const secondaryLine = detected_profiles.secondary.length
    ? `- Secondary profiles: ${detected_profiles.secondary.join(', ')}`
    : '';

  return [
    '# System Overview',
    '',
    blueprint.summary,
    '',
    '## Repository Type',
    '',
    `- Detected type: **${blueprint.repo_type}**`,
    `- Primary profile: **${detected_profiles.primary}** (${confidencePct}% confidence)`,
    secondaryLine,
    '',
    '### Detection reasons',
    '',
    ...detected_profiles.primaryReasons.map((r) => `- ${r}`),
    '',
    '## Architecture Style',
    '',
    ...(blueprint.architecture.style.map((v) => `- ${v}`) || ['- Unknown']),
    '',
    '## Modules',
    '',
    ...blueprint.modules.map((m) => `- **${m.name}**: ${m.purpose}`),
    '',
    '## Reusable Foundations',
    '',
    ...(blueprint.reusable_foundations.length
      ? blueprint.reusable_foundations.map((v) => `- ${v}`)
      : ['- None inferred'])
  ]
    .filter((line) => line !== undefined)
    .join('\n');
}

function buildDomainMap(blueprint: Blueprint): string {
  const entities =
    blueprint.entities.length > 0
      ? blueprint.entities
          .map(
            (e) =>
              `### ${e.name}\n- Description: ${e.description}\n- Fields: ${e.fields.join(', ') || 'None inferred'}\n- Rules:\n${e.rules.map((r) => `  - ${r}`).join('\n') || '  - None inferred'}`
          )
          .join('\n\n')
      : 'No entities inferred.';

  const useCases =
    blueprint.use_cases.length > 0
      ? blueprint.use_cases
          .map(
            (u) =>
              `### ${u.name}\n- Actors: ${u.actors.join(', ') || 'Unknown'}\n- Steps:\n${u.steps.map((s) => `  - ${s}`).join('\n')}\n- Related Entities: ${u.relatedEntities.join(', ') || 'None'}`
          )
          .join('\n\n')
      : 'No use cases inferred.';

  return `# Domain Map\n\n## Entities\n\n${entities}\n\n## Use Cases\n\n${useCases}`;
}

function buildArchitectureRules(blueprint: Blueprint): string {
  const inferredRules = blueprint.architecture.dependency_rules;

  const ruleFindings = blueprint.rule_findings.filter((f) =>
    f.ruleId.startsWith('dep/') || f.ruleId.startsWith('arch/')
  );

  const sections: string[] = [
    '# Architecture Rules',
    '',
    '## Inferred Dependency Rules',
    '',
    ...(inferredRules.length ? inferredRules.map((r) => `- ${r}`) : ['- None inferred']),
    '',
    '## Standing Rules',
    '',
    '- Keep configuration explicit and environment-aware.',
    '- Preserve module boundaries when adding new features.',
    '- Prefer reusable foundations over app-specific shortcuts.',
    ''
  ];

  if (ruleFindings.length > 0) {
    sections.push('## Detected Violations', '');
    for (const f of ruleFindings) {
      sections.push(`### ${severityBadge(f.severity)} ${f.title}`, '', `${f.summary}`, '');
      if (f.suggestions.length > 0) {
        sections.push('**Suggestions:**', '', ...f.suggestions.map((s) => `- ${s}`), '');
      }
    }
  }

  return sections.join('\n');
}

function buildApiSurfaces(blueprint: Blueprint): string {
  return (
    `# API Surfaces\n\n` +
    `${blueprint.api_surfaces.map((a) => `- **${a.type}** — ${a.name}: ${a.details}`).join('\n') || '- None inferred'}\n\n` +
    `## Events\n\n` +
    `${blueprint.events.map((e) => `- ${e}`).join('\n') || '- None inferred'}`
  );
}

function buildRisksAndGaps(blueprint: Blueprint): string {
  const findings = blueprint.rule_findings;

  const bySeverity: Partial<Record<RiskSeverity, RuleResult[]>> = {};
  for (const f of findings) {
    (bySeverity[f.severity] ??= []).push(f);
  }

  const severities: RiskSeverity[] = ['critical', 'high', 'medium', 'low', 'info'];
  const sections: string[] = ['# Risks and Gaps', ''];

  if (findings.length === 0) {
    sections.push('No structured findings from the rule engine.', '');
  } else {
    for (const sev of severities) {
      const group = bySeverity[sev];
      if (!group || group.length === 0) continue;
      sections.push(`## ${capitalize(sev)} Severity`, '');
      for (const f of group) {
        sections.push(
          `### ${f.title}`,
          '',
          f.summary,
          '',
          f.details,
          ''
        );
        if (f.affectedPaths.length > 0) {
          sections.push('**Affected paths:**', '', ...f.affectedPaths.map((p) => `- \`${p}\``), '');
        }
        if (f.suggestions.length > 0) {
          sections.push('**Suggestions:**', '', ...f.suggestions.map((s) => `- ${s}`), '');
        }
      }
    }
  }

  // Heuristic risks and open questions as fallback / supplement
  if (blueprint.risks.length > 0) {
    sections.push('## Additional Heuristic Risks', '');
    sections.push(...blueprint.risks.map((r) => `- ${r}`), '');
  }

  sections.push('## Open Questions', '');
  sections.push(
    ...(blueprint.open_questions.length
      ? blueprint.open_questions.map((q) => `- ${q}`)
      : ['- None']),
    ''
  );

  return sections.join('\n');
}

function buildNextPrompts(blueprint: Blueprint): string {
  const topFindings = blueprint.rule_findings.slice(0, 3);
  const findingsSummary =
    topFindings.length > 0
      ? topFindings.map((f, i) => `${i + 1}. **${f.title}** — ${f.suggestions[0] ?? f.summary}`).join('\n')
      : '- No critical findings detected.';

  return [
    '# Next Prompts',
    '',
    '## Top Findings to Address',
    '',
    findingsSummary,
    '',
    '## Suggested Agent Prompts',
    '',
    '- **Refactor**: Read `.analythis/blueprint.json` and refactor the codebase to align with the inferred architecture.',
    '- **Regenerate**: Generate a clean starter preserving reusable foundations and external interfaces.',
    '- **Extract Core**: Separate reusable business or platform primitives from app-specific logic.',
    '- **Onboarding**: Create a contributor guide from the blueprint.',
    ''
  ].join('\n');
}

function buildModuleReport(blueprint: Blueprint): string {
  return (
    '# Module Report\n\n' +
    blueprint.modules
      .map(
        (m) =>
          `## ${m.name}\n- Purpose: ${m.purpose}\n- Paths: ${m.paths.join(', ')}\n- Depends on: ${m.dependsOn.join(', ') || 'None inferred'}`
      )
      .join('\n\n')
  );
}

function buildDependencyReport(blueprint: Blueprint): string {
  return (
    '# Dependency Report\n\n' +
    (blueprint.dependencies
      .map((d) => `- **${d.name}** (${d.critical ? 'critical' : 'supporting'}): ${d.purpose}`)
      .join('\n') || '- No dependencies inferred')
  );
}

// ---------------------------------------------------------------------------
// Utilities
// ---------------------------------------------------------------------------

function severityBadge(severity: RiskSeverity): string {
  const badges: Record<RiskSeverity, string> = {
    critical: '🔴',
    high: '🟠',
    medium: '🟡',
    low: '🔵',
    info: 'ℹ️'
  };
  return badges[severity] ?? '';
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}
