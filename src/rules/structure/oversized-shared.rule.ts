import type { AnalysisRule, RuleResult } from '../types';

const SHARED_NAMES = ['shared', 'common', 'utils', 'helpers', 'lib'];

export const oversizedSharedRule: AnalysisRule = {
  id: 'struct/oversized-shared',
  title: 'Oversized Shared / Utils Module',
  description:
    'Flags generic shared or utility modules that may have grown into an unbounded catch-all.',
  severity: 'medium',
  ruleGroups: ['structure'],
  profiles: [],
  enabled: true,
  evaluate({ blueprint }): RuleResult[] {
    const suspects = blueprint.modules.filter((m) =>
      SHARED_NAMES.includes(m.name.toLowerCase())
    );

    if (suspects.length === 0) return [];

    // A shared module becomes suspect when many others depend on it
    const results: RuleResult[] = [];
    for (const shared of suspects) {
      const dependentCount = blueprint.modules.filter((m) => m.dependsOn.includes(shared.name)).length;
      if (dependentCount >= 3) {
        results.push({
          ruleId: 'struct/oversized-shared',
          title: `"${shared.name}" module has high fan-in (${dependentCount} dependents)`,
          severity: 'medium',
          summary: `"${shared.name}" is depended on by ${dependentCount} modules, suggesting it may be a catch-all.`,
          details:
            `Catch-all modules like "${shared.name}" accumulate unrelated utilities over time, ` +
            `creating implicit coupling between consumers. Each new addition slows down ` +
            `every dependent's build and test cycle.`,
          affectedPaths: shared.paths,
          suggestions: [
            `Audit the contents of "${shared.name}" and group utilities by subdomain.`,
            `Move domain-specific helpers close to the feature that owns them.`,
            `Keep only truly cross-cutting utilities (e.g. date formatting, error classes) in shared.`
          ]
        });
      }
    }

    return results;
  }
};
