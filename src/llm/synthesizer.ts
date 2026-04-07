import type { Blueprint } from '../core/types/blueprint';
import type { SynthesisTask, SynthesisOptions, SynthesisResult } from './types';
import { getLLMPlugin } from './registry';

// ---------------------------------------------------------------------------
// Prompt builders
// ---------------------------------------------------------------------------

function blueprintContext(blueprint: Blueprint): string {
  const modules = blueprint.modules.map((m) => {
    const resp = m.responsibilities?.length ? ` (${m.responsibilities.join(', ')})` : '';
    return `- ${m.name}${resp}: ${m.purpose}`;
  }).join('\n');

  const findings = blueprint.rule_findings.slice(0, 10).map(
    (f) => `  [${f.severity.toUpperCase()}] ${f.title}: ${f.summary}`
  ).join('\n');

  const risks = blueprint.risks.slice(0, 5).join('\n  ');

  return [
    `Project: ${blueprint.project_name}`,
    `Profile: ${blueprint.detected_profiles.primary} (confidence: ${Math.round(blueprint.detected_profiles.primaryConfidence * 100)}%)`,
    `Architecture: ${blueprint.architecture.style.join(', ')}`,
    `Modules:\n${modules}`,
    findings ? `Rule findings:\n${findings}` : '',
    risks ? `Heuristic risks:\n  ${risks}` : '',
    `Summary: ${blueprint.summary}`
  ].filter(Boolean).join('\n\n');
}

function buildPrompt(task: SynthesisTask, blueprint: Blueprint): string {
  const ctx = blueprintContext(blueprint);

  switch (task) {
    case 'summarize':
      return `You are a senior software architect. Read the following repository analysis and write a concise executive summary (3-5 paragraphs) for a technical audience.

Cover: the project's purpose and domain, architecture style and key modules, identified risks or architectural gaps, and recommended immediate next steps.

---
${ctx}
---

Write the executive summary now:`;

    case 'risks':
      return `You are a senior software architect specializing in code quality and risk assessment.

Analyze the following repository findings. For each significant risk:
1. Identify the root cause
2. Estimate the business impact (high / medium / low)
3. Suggest a concrete remediation step with an effort estimate

Then provide a prioritized remediation backlog (most critical first).

---
${ctx}

Full rule findings:
${JSON.stringify(blueprint.rule_findings, null, 2)}
---

Write the deep risk analysis now:`;

    case 'refactor':
      return `You are a senior software architect. Based on the following repository analysis, produce a step-by-step refactor plan.

For each refactor step include:
- What to change and where
- Why this change matters (architectural principle)
- Expected benefit
- Risk of not making this change
- Effort estimate (S / M / L)

Order steps from highest to lowest impact.

---
${ctx}

Dependency rules: ${blueprint.architecture.dependency_rules.join('; ') || 'none inferred'}
Refactor opportunities: ${blueprint.refactor_opportunities.slice(0, 5).join('; ') || 'none'}
---

Write the refactor plan now:`;

    case 'onboard':
      return `You are a senior engineer writing onboarding documentation for a new developer joining this codebase.

Write a complete onboarding guide that covers:
1. What this repository is and why it exists
2. Architecture overview (style, layers, key modules)
3. How to navigate the codebase — where to find key logic
4. How to make the first safe change (suggested starting point)
5. Common pitfalls and things to avoid
6. Key files and directories to read first

Use clear headings. Keep it actionable and concrete.

---
${ctx}
---

Write the onboarding guide now:`;
  }
}

// ---------------------------------------------------------------------------
// Synthesis runner
// ---------------------------------------------------------------------------

export async function synthesize(options: SynthesisOptions): Promise<SynthesisResult[]> {
  const { tasks, config, blueprint } = options;
  const plugin = getLLMPlugin(config.provider);
  const results: SynthesisResult[] = [];

  for (const task of tasks) {
    const prompt = buildPrompt(task, blueprint);
    const content = await plugin.synthesize(prompt, config);
    results.push({
      task,
      content,
      provider: config.provider,
      model: config.model,
      generatedAt: new Date().toISOString()
    });
  }

  return results;
}
