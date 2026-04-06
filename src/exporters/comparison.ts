import * as path from 'path';
import type { ComparisonReport } from '../core/engine/comparator';
import { writeJson, writeText, ensureDir } from '../utils';

export function exportComparisonJson(report: ComparisonReport, outputDir: string): void {
  ensureDir(outputDir);
  // Strip full blueprint objects for the JSON to keep it readable
  const slim = {
    repos: report.repos.map((r) => ({
      name: r.name,
      inputPath: r.inputPath,
      profile: r.blueprint.detected_profiles.primary,
      architectureStyles: r.blueprint.architecture.style,
      modules: r.blueprint.modules.map((m) => m.name),
      risksCount: r.blueprint.risks.length,
      ruleFindings: r.blueprint.rule_findings.length
    })),
    shared: report.shared,
    unique: report.unique,
    divergence: report.divergence,
    recommendation: report.recommendation,
    generatedAt: report.generatedAt
  };
  writeJson(path.join(outputDir, 'comparison.json'), slim);
}

export function exportComparisonMarkdown(report: ComparisonReport, outputDir: string): void {
  ensureDir(outputDir);
  const lines: string[] = [];

  lines.push('# Repository Comparison', '');
  lines.push(`Generated: ${report.generatedAt}`, '');

  // Summary table
  lines.push('## Repos', '');
  lines.push('| Repo | Profile | Architecture | Modules | Risks |');
  lines.push('| --- | --- | --- | --- | --- |');
  for (const repo of report.repos) {
    const profile = repo.blueprint.detected_profiles.primary;
    const arch = repo.blueprint.architecture.style.join(', ') || '—';
    const modules = repo.blueprint.modules.map((m) => m.name).join(', ') || '—';
    const risks = repo.blueprint.risks.length;
    lines.push(`| **${repo.name}** | ${profile} | ${arch} | ${modules} | ${risks} |`);
  }
  lines.push('');

  // Divergence flags
  lines.push('## Divergence', '');
  lines.push(`- Profile mismatch: **${report.divergence.profileMismatch ? 'Yes' : 'No'}**`);
  lines.push(`- Architecture mismatch: **${report.divergence.architectureMismatch ? 'Yes' : 'No'}**`);
  lines.push('');

  // Shared
  lines.push('## Shared Across All Repos', '');
  if (report.shared.architectureStyles.length > 0) {
    lines.push(`- Architecture styles: ${report.shared.architectureStyles.join(', ')}`);
  }
  if (report.shared.profiles.length > 0) {
    lines.push(`- Profiles: ${report.shared.profiles.join(', ')}`);
  }
  if (report.shared.risks.length > 0) {
    lines.push('- Common risks:');
    for (const r of report.shared.risks) lines.push(`  - ${r}`);
  }
  if (
    report.shared.architectureStyles.length === 0 &&
    report.shared.profiles.length === 0 &&
    report.shared.risks.length === 0
  ) {
    lines.push('- No shared characteristics found.');
  }
  lines.push('');

  // Unique per repo
  lines.push('## Unique Characteristics', '');
  for (const [repoName, uniq] of Object.entries(report.unique)) {
    lines.push(`### ${repoName}`, '');
    if (uniq.architectureStyles.length > 0) {
      lines.push(`- Architecture styles (unique): ${uniq.architectureStyles.join(', ')}`);
    }
    if (uniq.modules.length > 0) {
      lines.push(`- Unique modules: ${uniq.modules.join(', ')}`);
    }
    if (uniq.risks.length > 0) {
      lines.push('- Unique risks:');
      for (const r of uniq.risks.slice(0, 3)) lines.push(`  - ${r}`);
    }
    lines.push('');
  }

  // Per-repo rule findings
  lines.push('## Rule Findings Per Repo', '');
  for (const repo of report.repos) {
    const findings = repo.blueprint.rule_findings;
    lines.push(`### ${repo.name}`, '');
    if (findings.length === 0) {
      lines.push('- No structured findings.', '');
    } else {
      for (const f of findings.slice(0, 5)) {
        lines.push(`- **[${f.severity.toUpperCase()}]** ${f.title}: ${f.summary}`);
      }
      if (findings.length > 5) {
        lines.push(`- _(${findings.length - 5} more findings — see individual blueprint)_`);
      }
      lines.push('');
    }
  }

  // Recommendation
  lines.push('## Recommendation', '');
  lines.push(report.recommendation, '');

  writeText(path.join(outputDir, 'comparison.md'), lines.join('\n'));
}
