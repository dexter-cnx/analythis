import type { AnalysisRule, RuleResult } from '../types';

const HIGH_COUPLING_THRESHOLD = 4;

export const highCouplingRule: AnalysisRule = {
  id: 'dep/high-coupling',
  title: 'High Module Coupling',
  description: 'Flags modules with an unusually high number of declared dependencies.',
  severity: 'medium',
  ruleGroups: ['dependency'],
  profiles: [],
  enabled: true,
  evaluate({ blueprint }): RuleResult[] {
    return blueprint.modules
      .filter((m) => m.dependsOn.length >= HIGH_COUPLING_THRESHOLD)
      .map((m) => ({
        ruleId: 'dep/high-coupling',
        title: `High coupling in module "${m.name}"`,
        severity: 'medium' as const,
        summary: `"${m.name}" depends on ${m.dependsOn.length} other modules (threshold: ${HIGH_COUPLING_THRESHOLD}).`,
        details:
          `Modules with many incoming or outgoing dependencies tend to become bottlenecks, ` +
          `slow to change and hard to test in isolation.`,
        affectedPaths: m.paths,
        suggestions: [
          `Split "${m.name}" along clear sub-domain boundaries.`,
          `Introduce an abstraction layer so dependents rely on an interface, not the module directly.`,
          `Evaluate which dependencies are truly necessary vs coincidental.`
        ]
      }));
  }
};
