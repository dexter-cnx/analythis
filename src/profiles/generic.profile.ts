import type { AnalysisProfile } from './types';

export const genericProfile: AnalysisProfile = {
  id: 'generic',
  title: 'Generic',
  description: 'Fallback profile for repositories that do not match a more specific profile.',
  signals: [
    {
      id: 'generic:always',
      description: 'Repository is present and scannable',
      weight: 1,
      test: () => true
    }
  ],
  inspectors: ['inventory', 'architecture', 'domain', 'interface', 'manifest', 'risk'],
  ruleGroups: ['structure', 'cross-cutting'],
  heuristicStrategies: ['directory-pattern', 'manifest-scan'],
  weights: {}
};
