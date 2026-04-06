import type { AnalysisRule, RuleResult } from '../types';

const UI_TERMS = ['ui', 'view', 'screen', 'widget', 'component', 'page', 'layout'];
const DATA_TERMS = ['repository', 'dao', 'datasource', 'database', 'storage', 'cache', 'persistence'];

export const mixedConcernsRule: AnalysisRule = {
  id: 'arch/mixed-concerns',
  title: 'Mixed Concerns in Module',
  description: 'Flags modules whose name or purpose suggests they mix UI and data responsibilities.',
  severity: 'medium',
  ruleGroups: ['architecture'],
  profiles: [],
  enabled: true,
  evaluate({ blueprint }): RuleResult[] {
    const results: RuleResult[] = [];

    for (const module of blueprint.modules) {
      const label = `${module.name} ${module.purpose}`.toLowerCase();
      const hasUi = UI_TERMS.some((t) => label.includes(t));
      const hasData = DATA_TERMS.some((t) => label.includes(t));

      if (hasUi && hasData) {
        results.push({
          ruleId: 'arch/mixed-concerns',
          title: `Mixed UI and data concerns in "${module.name}"`,
          severity: 'medium',
          summary: `"${module.name}" appears to mix UI rendering with data access logic.`,
          details:
            `Modules that combine presentation and persistence concerns violate separation of responsibilities, ` +
            `making them harder to test and reuse independently.`,
          affectedPaths: module.paths,
          suggestions: [
            `Extract data access logic into a dedicated repository or datasource module.`,
            `Keep UI components ignorant of persistence details — inject data via interfaces.`,
            `Consider splitting "${module.name}" into "${module.name}-ui" and "${module.name}-data".`
          ]
        });
      }
    }

    return results;
  }
};
