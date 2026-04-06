import type { AnalysisProfile } from './types';

export const webProfile: AnalysisProfile = {
  id: 'web',
  title: 'Web Frontend',
  description: 'React, Vue, Angular, Svelte, or Next.js frontend application.',
  signals: [
    {
      id: 'web:nextjs-config',
      description: 'Has next.config.js or next.config.ts',
      weight: 10,
      test: (inv) => inv.notableFiles.some((f) => /next\.config/i.test(f))
    },
    {
      id: 'web:vite-config',
      description: 'Has vite.config file',
      weight: 8,
      test: (inv) => inv.notableFiles.some((f) => /vite\.config/i.test(f))
    },
    {
      id: 'web:tailwind-config',
      description: 'Has tailwind.config file',
      weight: 6,
      test: (inv) => inv.notableFiles.some((f) => /tailwind\.config/i.test(f))
    },
    {
      id: 'web:framework-hint-nextjs',
      description: 'Framework hint: Next.js detected',
      weight: 10,
      test: (inv) => inv.frameworkHints.includes('Next.js')
    },
    {
      id: 'web:components-dir',
      description: 'Has components/ directory at top level',
      weight: 8,
      test: (inv) => inv.topLevelDirs.includes('components')
    },
    {
      id: 'web:pages-dir',
      description: 'Has pages/ directory at top level',
      weight: 8,
      test: (inv) => inv.topLevelDirs.includes('pages')
    },
    {
      id: 'web:public-dir',
      description: 'Has public/ directory (static assets)',
      weight: 5,
      test: (inv) => inv.topLevelDirs.includes('public')
    },
    {
      id: 'web:html-entry',
      description: 'Has index.html as root file',
      weight: 6,
      test: (inv) => inv.rootFiles.includes('index.html')
    },
    {
      id: 'web:ts-language',
      description: 'TypeScript or JavaScript as primary language',
      weight: 2,
      test: (inv) => inv.languages.includes('TypeScript') || inv.languages.includes('JavaScript')
    },
    {
      id: 'web:no-server-entry',
      description: 'No server entry points detected',
      weight: 3,
      test: (inv) =>
        !inv.entryPoints.some((f) => /server\.(ts|js)$/i.test(f))
    }
  ],
  inspectors: ['inventory', 'architecture', 'domain', 'interface', 'manifest', 'risk'],
  ruleGroups: ['structure', 'architecture', 'cross-cutting'],
  heuristicStrategies: ['framework-hint', 'directory-pattern', 'entry-point-scan'],
  weights: {
    'web:nextjs-config': 10,
    'web:vite-config': 8,
    'web:tailwind-config': 6,
    'web:framework-hint-nextjs': 10,
    'web:components-dir': 8,
    'web:pages-dir': 8,
    'web:public-dir': 5,
    'web:html-entry': 6,
    'web:ts-language': 2,
    'web:no-server-entry': 3
  }
};
