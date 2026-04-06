import type { AnalysisProfile } from './types';

export const mobileProfile: AnalysisProfile = {
  id: 'mobile',
  title: 'Mobile Application',
  description: 'Flutter, React Native, or native Android/iOS application.',
  signals: [
    {
      id: 'mobile:pubspec',
      description: 'Has pubspec.yaml (Flutter/Dart project manifest)',
      weight: 12,
      test: (inv) => inv.manifests.some((m) => m.endsWith('pubspec.yaml'))
    },
    {
      id: 'mobile:dart-language',
      description: 'Dart detected as a language',
      weight: 10,
      test: (inv) => inv.languages.includes('Dart')
    },
    {
      id: 'mobile:framework-hint-flutter',
      description: 'Framework hint: Flutter/Dart',
      weight: 12,
      test: (inv) => inv.frameworkHints.some((h) => /flutter|dart/i.test(h))
    },
    {
      id: 'mobile:android-dir',
      description: 'Has android/ directory',
      weight: 10,
      test: (inv) => inv.topLevelDirs.includes('android')
    },
    {
      id: 'mobile:ios-dir',
      description: 'Has ios/ directory',
      weight: 10,
      test: (inv) => inv.topLevelDirs.includes('ios')
    },
    {
      id: 'mobile:lib-dir',
      description: 'Has lib/ directory (Flutter source root)',
      weight: 6,
      test: (inv) => inv.topLevelDirs.includes('lib')
    },
    {
      id: 'mobile:no-packages-dir',
      description: 'No packages/ or apps/ directory (not a monorepo)',
      weight: 4,
      test: (inv) => !inv.topLevelDirs.includes('packages') && !inv.topLevelDirs.includes('apps')
    }
  ],
  inspectors: ['inventory', 'architecture', 'domain', 'interface', 'manifest', 'risk'],
  ruleGroups: ['structure', 'architecture', 'cross-cutting'],
  heuristicStrategies: ['framework-hint', 'manifest-scan', 'directory-pattern'],
  weights: {
    'mobile:pubspec': 12,
    'mobile:dart-language': 10,
    'mobile:framework-hint-flutter': 12,
    'mobile:android-dir': 10,
    'mobile:ios-dir': 10,
    'mobile:lib-dir': 6,
    'mobile:no-packages-dir': 4
  }
};
