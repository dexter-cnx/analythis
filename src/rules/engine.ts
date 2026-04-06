import type { AnalysisContext, AnalysisRule, RuleResult, RiskSeverity } from './types';

const SEVERITY_ORDER: Record<RiskSeverity, number> = {
  critical: 0,
  high: 1,
  medium: 2,
  low: 3,
  info: 4
};

export class RuleEngine {
  private readonly rules: AnalysisRule[];

  constructor(rules: AnalysisRule[]) {
    this.rules = rules;
  }

  run(context: AnalysisContext): RuleResult[] {
    const primaryProfileId = context.profileResult.primary.profile.id;
    const findings: RuleResult[] = [];

    for (const rule of this.rules) {
      if (!rule.enabled) continue;
      if (rule.profiles.length > 0 && !rule.profiles.includes(primaryProfileId)) continue;

      const results = rule.evaluate(context);
      findings.push(...results);
    }

    return findings.sort(
      (a, b) => SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity]
    );
  }
}
