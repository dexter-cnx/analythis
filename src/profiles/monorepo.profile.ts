import type { AnalysisProfile } from './types';

export const monorepoProfile: AnalysisProfile = {
  id: 'monorepo',
  title: 'Monorepo',
  description: 'Workspace containing multiple packages or applications managed together.',
  signals: [
    {
      id: 'monorepo:packages-dir',
      description: 'Has packages/ directory at root',
      weight: 10,
      test: (inv) => inv.topLevelDirs.includes('packages')
    },
    {
      id: 'monorepo:apps-dir',
      description: 'Has apps/ directory at root',
      weight: 10,
      test: (inv) => inv.topLevelDirs.includes('apps')
    },
    {
      id: 'monorepo:melos',
      description: 'Has melos.yaml (Flutter/Dart monorepo orchestration)',
      weight: 12,
      test: (inv) => inv.manifests.some((m) => m.endsWith('melos.yaml'))
    },
    {
      id: 'monorepo:framework-hint',
      description: 'Framework hint: Monorepo workspace detected',
      weight: 10,
      test: (inv) => inv.frameworkHints.some((h) => /monorepo workspace/i.test(h))
    },
    {
      id: 'monorepo:multiple-manifests',
      description: 'Multiple package manifests detected (> 2)',
      weight: 8,
      test: (inv) => inv.manifests.length > 2
    },
    {
      id: 'monorepo:libs-dir',
      description: 'Has libs/ directory (Nx monorepo convention)',
      weight: 8,
      test: (inv) => inv.topLevelDirs.includes('libs')
    },
    {
      id: 'monorepo:turbo-config',
      description: 'Has turbo.json (Turborepo)',
      weight: 10,
      test: (inv) => inv.rootFiles.includes('turbo.json')
    },
    {
      id: 'monorepo:lerna',
      description: 'Has lerna.json',
      weight: 10,
      test: (inv) => inv.rootFiles.includes('lerna.json')
    },
    {
      id: 'monorepo:pnpm-workspace',
      description: 'Has pnpm-workspace.yaml',
      weight: 10,
      test: (inv) => inv.rootFiles.includes('pnpm-workspace.yaml')
    }
  ],
  inspectors: ['inventory', 'architecture', 'manifest', 'risk'],
  ruleGroups: ['dependency', 'structure', 'cross-cutting'],
  heuristicStrategies: ['directory-pattern', 'manifest-scan', 'framework-hint'],
  weights: {
    'monorepo:packages-dir': 10,
    'monorepo:apps-dir': 10,
    'monorepo:melos': 12,
    'monorepo:framework-hint': 10,
    'monorepo:multiple-manifests': 8,
    'monorepo:libs-dir': 8,
    'monorepo:turbo-config': 10,
    'monorepo:lerna': 10,
    'monorepo:pnpm-workspace': 10
  }
};
