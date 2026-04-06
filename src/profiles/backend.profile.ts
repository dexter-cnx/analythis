import type { AnalysisProfile } from './types';

export const backendProfile: AnalysisProfile = {
  id: 'backend',
  title: 'Backend Service',
  description: 'Server-side application: REST API, GraphQL service, or similar backend.',
  signals: [
    {
      id: 'backend:server-entry',
      description: 'Has server entry point (server.ts, server.js, app.ts)',
      weight: 12,
      test: (inv) => inv.entryPoints.some((f) => /server\.(ts|js)|app\.(ts|js)$/i.test(f))
    },
    {
      id: 'backend:framework-hint',
      description: 'Framework hint: Node backend, Express, Nest, Koa detected',
      weight: 10,
      test: (inv) => inv.frameworkHints.some((h) => /node backend|express|nest|koa/i.test(h))
    },
    {
      id: 'backend:routes-dir',
      description: 'Has routes/ or controllers/ directory',
      weight: 8,
      test: (inv) =>
        inv.topLevelDirs.includes('routes') ||
        inv.topLevelDirs.includes('controllers') ||
        inv.topLevelDirs.includes('handlers')
    },
    {
      id: 'backend:api-dir',
      description: 'Has api/ directory at root',
      weight: 6,
      test: (inv) => inv.topLevelDirs.includes('api')
    },
    {
      id: 'backend:infra-files',
      description: 'Has Dockerfile or docker-compose (deployment artifacts)',
      weight: 5,
      test: (inv) => inv.infraFiles.length > 0
    },
    {
      id: 'backend:db-manifests',
      description: 'Has database-related manifests (prisma, go.mod, pom.xml, etc.)',
      weight: 6,
      test: (inv) =>
        inv.manifests.some((m) => /prisma|go\.mod|pom\.xml|build\.gradle|requirements\.txt|pyproject\.toml/i.test(m))
    },
    {
      id: 'backend:no-pubspec',
      description: 'No Flutter/Dart pubspec.yaml present',
      weight: 3,
      test: (inv) => !inv.manifests.some((m) => m.endsWith('pubspec.yaml'))
    },
    {
      id: 'backend:no-web-config',
      description: 'No web build config (next.config, vite.config) present',
      weight: 3,
      test: (inv) => !inv.notableFiles.some((f) => /next\.config|vite\.config/i.test(f))
    },
    {
      id: 'backend:migrations-dir',
      description: 'Has migrations/ directory (database schema management)',
      weight: 7,
      test: (inv) => inv.topLevelDirs.includes('migrations')
    }
  ],
  inspectors: ['inventory', 'architecture', 'domain', 'interface', 'manifest', 'risk'],
  ruleGroups: ['dependency', 'architecture', 'structure', 'cross-cutting'],
  heuristicStrategies: ['entry-point-scan', 'manifest-scan', 'directory-pattern'],
  weights: {
    'backend:server-entry': 12,
    'backend:framework-hint': 10,
    'backend:routes-dir': 8,
    'backend:api-dir': 6,
    'backend:infra-files': 5,
    'backend:db-manifests': 6,
    'backend:no-pubspec': 3,
    'backend:no-web-config': 3,
    'backend:migrations-dir': 7
  }
};
