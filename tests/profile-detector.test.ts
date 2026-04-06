import { detectProfile } from '../src/profiles/detector';
import type { Inventory } from '../src/core/types/inventory';

function makeInventory(overrides: Partial<Inventory> = {}): Inventory {
  return {
    repoName: 'test-repo',
    repoRoot: '/tmp/test-repo',
    repoType: 'unknown',
    rootFiles: [],
    topLevelDirs: [],
    languages: [],
    manifests: [],
    entryPoints: [],
    testLocations: [],
    ciFiles: [],
    infraFiles: [],
    notableFiles: [],
    packageManagers: [],
    frameworkHints: [],
    ...overrides
  };
}

describe('detectProfile', () => {
  describe('backend detection', () => {
    it('selects backend as primary when server entry and routes exist', () => {
      const inventory = makeInventory({
        entryPoints: ['src/server.ts'],
        topLevelDirs: ['src', 'routes'],
        frameworkHints: ['Node backend']
      });
      const result = detectProfile(inventory);
      expect(result.primary.profile.id).toBe('backend');
      expect(result.primary.confidence).toBeGreaterThan(0.3);
    });

    it('includes matched signal ids for backend', () => {
      const inventory = makeInventory({
        entryPoints: ['src/server.ts'],
        topLevelDirs: ['routes'],
        infraFiles: ['Dockerfile']
      });
      const result = detectProfile(inventory);
      expect(result.primary.matchedSignals).toContain('backend:server-entry');
    });
  });

  describe('monorepo detection', () => {
    it('selects monorepo when packages/ and apps/ directories exist', () => {
      const inventory = makeInventory({
        topLevelDirs: ['packages', 'apps'],
        manifests: ['package.json', 'packages/core/package.json', 'apps/web/package.json'],
        frameworkHints: ['Monorepo workspace']
      });
      const result = detectProfile(inventory);
      expect(result.primary.profile.id).toBe('monorepo');
    });

    it('detects monorepo via melos.yaml', () => {
      const inventory = makeInventory({
        manifests: ['pubspec.yaml', 'melos.yaml', 'packages/auth/pubspec.yaml'],
        topLevelDirs: ['packages', 'lib'],
        languages: ['Dart']
      });
      const result = detectProfile(inventory);
      expect(result.primary.profile.id).toBe('monorepo');
    });
  });

  describe('mobile detection', () => {
    it('selects mobile for Flutter project', () => {
      const inventory = makeInventory({
        manifests: ['pubspec.yaml'],
        languages: ['Dart'],
        frameworkHints: ['Flutter/Dart'],
        topLevelDirs: ['lib', 'android', 'ios']
      });
      const result = detectProfile(inventory);
      expect(result.primary.profile.id).toBe('mobile');
      expect(result.primary.confidence).toBeGreaterThan(0.5);
    });
  });

  describe('web detection', () => {
    it('selects web for Next.js project', () => {
      const inventory = makeInventory({
        notableFiles: ['next.config.ts', 'tsconfig.json'],
        frameworkHints: ['Next.js'],
        topLevelDirs: ['src', 'pages', 'public'],
        languages: ['TypeScript']
      });
      const result = detectProfile(inventory);
      expect(result.primary.profile.id).toBe('web');
    });

    it('selects web for Vite project with components dir', () => {
      const inventory = makeInventory({
        notableFiles: ['vite.config.ts', 'tsconfig.json'],
        topLevelDirs: ['src', 'components', 'public'],
        languages: ['TypeScript']
      });
      const result = detectProfile(inventory);
      expect(result.primary.profile.id).toBe('web');
    });
  });

  describe('library detection', () => {
    it('selects library when lib/ and examples/ exist with index entry', () => {
      const inventory = makeInventory({
        topLevelDirs: ['src', 'lib', 'examples', 'docs'],
        entryPoints: ['src/index.ts'],
        languages: ['TypeScript']
      });
      const result = detectProfile(inventory);
      expect(result.primary.profile.id).toBe('library');
    });

    it('detects Rust crate as library', () => {
      const inventory = makeInventory({
        manifests: ['Cargo.toml'],
        topLevelDirs: ['src', 'examples'],
        languages: ['Rust']
      });
      const result = detectProfile(inventory);
      expect(result.primary.profile.id).toBe('library');
    });
  });

  describe('hint handling', () => {
    it('promotes hinted profile to primary even when not auto-detected winner', () => {
      const inventory = makeInventory({
        entryPoints: ['src/server.ts'],
        topLevelDirs: ['routes']
      });
      // backend would naturally win — but we hint monorepo
      const result = detectProfile(inventory, 'monorepo');
      expect(result.primary.profile.id).toBe('monorepo');
    });

    it('does not promote generic hint', () => {
      const inventory = makeInventory({
        entryPoints: ['src/server.ts'],
        topLevelDirs: ['routes'],
        frameworkHints: ['Node backend']
      });
      const result = detectProfile(inventory, 'generic');
      expect(result.primary.profile.id).toBe('backend');
    });
  });

  describe('secondary profiles', () => {
    it('returns secondary profiles when multiple match significantly', () => {
      const inventory = makeInventory({
        manifests: ['pubspec.yaml'],
        languages: ['Dart'],
        frameworkHints: ['Flutter/Dart'],
        topLevelDirs: ['lib', 'android', 'ios', 'packages'],
        // packages dir also signals monorepo
      });
      const result = detectProfile(inventory);
      // primary should be mobile; monorepo could appear as secondary
      expect(result.primary.profile.id).toBe('mobile');
      expect(Array.isArray(result.secondary)).toBe(true);
    });
  });

  describe('allMatches', () => {
    it('includes all 6 profiles in allMatches', () => {
      const inventory = makeInventory();
      const result = detectProfile(inventory);
      expect(result.allMatches).toHaveLength(6);
    });

    it('returns non-generic matches sorted descending by score', () => {
      const inventory = makeInventory({
        entryPoints: ['src/server.ts'],
        topLevelDirs: ['routes', 'controllers'],
        frameworkHints: ['Node backend']
      });
      const result = detectProfile(inventory);
      // primary (best non-generic) should have the highest score among non-generics
      const nonGeneric = result.allMatches.filter((m) => m.profile.id !== 'generic');
      if (nonGeneric.length > 1) {
        expect(nonGeneric[0].score).toBeGreaterThanOrEqual(nonGeneric[1].score);
      }
    });
  });

  describe('generic fallback', () => {
    it('always has confidence > 0 for generic profile', () => {
      const inventory = makeInventory();
      const result = detectProfile(inventory);
      const generic = result.allMatches.find((m) => m.profile.id === 'generic');
      expect(generic).toBeDefined();
      expect(generic!.confidence).toBeGreaterThan(0);
    });
  });
});
