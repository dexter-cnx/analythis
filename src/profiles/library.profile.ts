import type { AnalysisProfile } from './types';

export const libraryProfile: AnalysisProfile = {
  id: 'library',
  title: 'Library / Package',
  description: 'Reusable library or SDK designed to be consumed by other projects.',
  signals: [
    {
      id: 'library:lib-dir',
      description: 'Has lib/ directory (common library source root)',
      weight: 8,
      test: (inv) => inv.topLevelDirs.includes('lib')
    },
    {
      id: 'library:examples-dir',
      description: 'Has examples/ directory',
      weight: 8,
      test: (inv) => inv.topLevelDirs.includes('examples')
    },
    {
      id: 'library:docs-dir',
      description: 'Has docs/ directory',
      weight: 5,
      test: (inv) => inv.topLevelDirs.includes('docs')
    },
    {
      id: 'library:index-entry',
      description: 'Has index.ts or index.js as an entry point',
      weight: 7,
      test: (inv) => inv.entryPoints.some((f) => /index\.(ts|js|tsx|jsx)$/i.test(f))
    },
    {
      id: 'library:no-server-entry',
      description: 'No server.ts / server.js entry detected',
      weight: 5,
      test: (inv) => !inv.entryPoints.some((f) => /server\.(ts|js)$/i.test(f))
    },
    {
      id: 'library:no-web-config',
      description: 'No web build config (next.config, vite.config)',
      weight: 4,
      test: (inv) => !inv.notableFiles.some((f) => /next\.config|vite\.config/i.test(f))
    },
    {
      id: 'library:no-mobile',
      description: 'No android/ or ios/ directories present',
      weight: 3,
      test: (inv) => !inv.topLevelDirs.includes('android') && !inv.topLevelDirs.includes('ios')
    },
    {
      id: 'library:types-dir',
      description: 'Has types/ or typings/ directory',
      weight: 6,
      test: (inv) => inv.topLevelDirs.includes('types') || inv.topLevelDirs.includes('typings')
    },
    {
      id: 'library:ts-language',
      description: 'TypeScript as primary language (common for JS libraries)',
      weight: 3,
      test: (inv) => inv.languages.includes('TypeScript')
    },
    {
      id: 'library:cargo-toml',
      description: 'Has Cargo.toml (Rust crate)',
      weight: 10,
      test: (inv) => inv.manifests.some((m) => m.endsWith('Cargo.toml'))
    }
  ],
  inspectors: ['inventory', 'architecture', 'domain', 'manifest', 'risk'],
  ruleGroups: ['structure', 'dependency', 'cross-cutting'],
  heuristicStrategies: ['entry-point-scan', 'directory-pattern', 'manifest-scan'],
  weights: {
    'library:lib-dir': 8,
    'library:examples-dir': 8,
    'library:docs-dir': 5,
    'library:index-entry': 7,
    'library:no-server-entry': 5,
    'library:no-web-config': 4,
    'library:no-mobile': 3,
    'library:types-dir': 6,
    'library:ts-language': 3,
    'library:cargo-toml': 10
  }
};
