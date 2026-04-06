import type { AnalysisRule, RuleResult } from '../types';

/**
 * Heuristic: if an architecture declares clean-architecture layers
 * (presentation → domain → data) but no dependency_rules are present
 * to enforce them, flag it as a gap.
 */
export const boundaryViolationRule: AnalysisRule = {
  id: 'dep/boundary-violation',
  title: 'Missing Layer Boundary Rules',
  description: 'Detects clean-architecture setups that have no enforced dependency rules.',
  severity: 'medium',
  ruleGroups: ['dependency', 'architecture'],
  profiles: [],
  enabled: true,
  evaluate({ blueprint }): RuleResult[] {
    const { style, layers, dependency_rules } = blueprint.architecture;
    const hasCleanArch = style.includes('clean-architecture');
    const hasLayers = layers.length >= 3;
    const hasRules = dependency_rules.length > 0;

    if (hasCleanArch && hasLayers && !hasRules) {
      return [
        {
          ruleId: 'dep/boundary-violation',
          title: 'Clean architecture layers declared but no dependency rules enforced',
          severity: 'medium',
          summary: `Layers (${layers.join(', ')}) exist but no dependency rules are defined.`,
          details:
            `Without explicit rules (e.g. "presentation must not import from data directly"), ` +
            `layer violations accumulate silently. Tooling like import-restrictions or ` +
            `eslint-plugin-boundaries can enforce this automatically.`,
          affectedPaths: [],
          suggestions: [
            `Add eslint-plugin-boundaries or import-restrictions to CI.`,
            `Document which layers may import which in architecture-rules.md.`,
            `Add unit tests that assert forbidden imports are absent.`
          ]
        }
      ];
    }

    return [];
  }
};
