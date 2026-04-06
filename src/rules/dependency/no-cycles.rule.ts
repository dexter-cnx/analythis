import type { AnalysisRule, RuleResult } from '../types';
import type { BlueprintModule } from '../../core/types/blueprint';

export const noCyclesRule: AnalysisRule = {
  id: 'dep/no-cycles',
  title: 'Cyclic Module Dependencies',
  description: 'Detects modules that mutually depend on each other, forming a cycle.',
  severity: 'high',
  ruleGroups: ['dependency'],
  profiles: [],
  enabled: true,
  evaluate({ blueprint }): RuleResult[] {
    const results: RuleResult[] = [];
    const modules = blueprint.modules;

    for (let i = 0; i < modules.length; i++) {
      for (let j = i + 1; j < modules.length; j++) {
        const a = modules[i];
        const b = modules[j];
        if (dependsOn(a, b.name) && dependsOn(b, a.name)) {
          results.push({
            ruleId: 'dep/no-cycles',
            title: `Cyclic dependency: ${a.name} ↔ ${b.name}`,
            severity: 'high',
            summary: `Modules "${a.name}" and "${b.name}" depend on each other.`,
            details:
              `A cycle between "${a.name}" and "${b.name}" makes it impossible to change ` +
              `either module in isolation and complicates testing and ownership.`,
            affectedPaths: [...a.paths, ...b.paths],
            suggestions: [
              `Introduce a shared abstraction that both modules depend on instead of each other.`,
              `Move the shared concern into a third module (e.g. "shared" or "core").`,
              `Review which direction the dependency should actually flow.`
            ]
          });
        }
      }
    }

    return results;
  }
};

function dependsOn(module: BlueprintModule, target: string): boolean {
  return module.dependsOn.includes(target);
}
