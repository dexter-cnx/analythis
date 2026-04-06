import type { AnalysisRule, RuleResult } from '../types';

export const missingServiceLayerRule: AnalysisRule = {
  id: 'arch/missing-service-layer',
  title: 'Missing Service / Use-Case Layer',
  description:
    'Flags backend repositories where routes/controllers exist but no service or use-case layer is detected.',
  severity: 'high',
  ruleGroups: ['architecture'],
  profiles: ['backend'],
  enabled: true,
  evaluate({ blueprint, inventory }): RuleResult[] {
    const dirs = inventory.topLevelDirs;
    const hasRoutes = dirs.includes('routes') || dirs.includes('controllers') || dirs.includes('handlers');
    const hasServices =
      dirs.includes('services') ||
      dirs.includes('usecases') ||
      dirs.includes('use-cases') ||
      blueprint.modules.some((m) => /service|usecase|use.case/i.test(m.name));

    if (hasRoutes && !hasServices) {
      return [
        {
          ruleId: 'arch/missing-service-layer',
          title: 'No service/use-case layer found',
          severity: 'high',
          summary: 'Routes or controllers exist but no service or use-case layer is detected.',
          details:
            `Without a service layer, business logic tends to accumulate inside route handlers, ` +
            `which makes it untestable without spinning up the HTTP server. ` +
            `A thin controller → service → repository stack isolates domain logic.`,
          affectedPaths: ['routes', 'controllers', 'handlers'].filter((d) => dirs.includes(d)),
          suggestions: [
            `Introduce a services/ or use-cases/ directory.`,
            `Move business logic out of route handlers into service functions.`,
            `Keep controllers thin — they should only parse input, call a service, and return a response.`
          ]
        }
      ];
    }

    return [];
  }
};
