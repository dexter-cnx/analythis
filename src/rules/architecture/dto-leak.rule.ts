import type { AnalysisRule, RuleResult } from '../types';

export const dtoLeakRule: AnalysisRule = {
  id: 'arch/dto-leak',
  title: 'Entity Exposed Directly via API Surface',
  description:
    'Heuristic: flags when domain entities share names with API responses without a DTO layer.',
  severity: 'medium',
  ruleGroups: ['architecture'],
  profiles: ['backend'],
  enabled: true,
  evaluate({ blueprint }): RuleResult[] {
    if (!blueprint.api_surfaces.length || !blueprint.entities.length) return [];

    const apiNames = blueprint.api_surfaces.map((a) => a.name.toLowerCase());
    const leaked: string[] = blueprint.entities
      .filter((e) => apiNames.some((n) => n.includes(e.name.toLowerCase())))
      .map((e) => e.name);

    if (leaked.length === 0) return [];

    return [
      {
        ruleId: 'arch/dto-leak',
        title: 'Domain entities may be leaking into API responses',
        severity: 'medium',
        summary: `Entities [${leaked.join(', ')}] appear to be exposed directly via API surfaces.`,
        details:
          `Returning raw domain entities from API endpoints couples your API contract to internal ` +
          `data models. Schema changes in entities break API consumers. DTOs (Data Transfer Objects) ` +
          `provide a stable, versioned interface between domain and transport layers.`,
        affectedPaths: [],
        suggestions: [
          `Introduce a dto/ or contracts/ directory with explicit response shapes.`,
          `Map entities to DTOs in the service layer before returning to controllers.`,
          `Consider using a validation library (zod, class-validator) to enforce DTO schemas.`
        ]
      }
    ];
  }
};
