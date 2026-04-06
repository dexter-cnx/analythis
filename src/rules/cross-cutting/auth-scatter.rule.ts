import type { AnalysisRule, RuleResult } from '../types';

const AUTH_TERMS = /auth|jwt|session|token|login|logout|oauth|identity|permission|rbac/i;

export const authScatterRule: AnalysisRule = {
  id: 'cross/auth-scatter',
  title: 'Auth Logic Scatter',
  description: 'Detects authentication or authorization logic spread across multiple modules.',
  severity: 'high',
  ruleGroups: ['cross-cutting'],
  profiles: [],
  enabled: true,
  evaluate({ blueprint }): RuleResult[] {
    const authModules = blueprint.modules.filter(
      (m) => AUTH_TERMS.test(m.name) || AUTH_TERMS.test(m.purpose)
    );
    const authEntities = blueprint.entities.filter((e) => AUTH_TERMS.test(e.name));
    const authTotal = new Set([...authModules.map((m) => m.name), ...authEntities.map((e) => e.name)]);

    if (authTotal.size >= 3) {
      return [
        {
          ruleId: 'cross/auth-scatter',
          title: `Auth logic detected in ${authTotal.size} places`,
          severity: 'high',
          summary: `Auth/identity concerns appear in modules and entities: ${[...authTotal].join(', ')}.`,
          details:
            `Authentication and authorisation are security-critical cross-cutting concerns. ` +
            `When scattered, they are easy to miss in security reviews, inconsistently enforced, ` +
            `and difficult to rotate or replace (e.g. swapping JWT for sessions).`,
          affectedPaths: authModules.flatMap((m) => m.paths),
          suggestions: [
            `Consolidate auth logic into a single auth/ module or service.`,
            `Use middleware/guards consistently — do not re-implement auth checks inline.`,
            `Keep auth tokens, session management, and permission checks in one auditable place.`
          ]
        }
      ];
    }

    return [];
  }
};
