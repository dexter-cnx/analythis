import type { AnalysisRule, RuleResult } from '../types';

/** Depth at which a module path is considered deeply nested. */
const NESTING_THRESHOLD = 4;

export const deepNestingRule: AnalysisRule = {
  id: 'struct/deep-nesting',
  title: 'Deeply Nested Module Paths',
  description: 'Flags module paths that suggest excessive directory nesting.',
  severity: 'low',
  ruleGroups: ['structure'],
  profiles: [],
  enabled: true,
  evaluate({ blueprint }): RuleResult[] {
    const deep = blueprint.modules.filter((m) =>
      m.paths.some((p) => p.split('/').length > NESTING_THRESHOLD)
    );

    return deep.map((m) => ({
      ruleId: 'struct/deep-nesting',
      title: `Deeply nested path in module "${m.name}"`,
      severity: 'low' as const,
      summary: `Module "${m.name}" has paths with more than ${NESTING_THRESHOLD} directory levels.`,
      details:
        `Deep nesting makes imports verbose, increases cognitive load when navigating, ` +
        `and often signals an over-engineered sub-structure that could be flattened.`,
      affectedPaths: m.paths.filter((p) => p.split('/').length > NESTING_THRESHOLD),
      suggestions: [
        `Flatten the directory structure where sub-folders contain only one file.`,
        `Barrel-export from intermediate index files to keep imports short.`,
        `Reconsider if the nesting reflects real architectural boundaries or is incidental.`
      ]
    }));
  }
};
