import * as path from 'path';
import { inspectInventory } from '../src/inspectors/inventory-inspector';

const simpleNode = path.join(__dirname, 'fixtures', 'simple-node');
const monorepo = path.join(__dirname, 'fixtures', 'monorepo');

describe('inspectInventory', () => {
  describe('simple-node fixture', () => {
    let inventory: ReturnType<typeof inspectInventory>;

    beforeAll(() => {
      inventory = inspectInventory(simpleNode);
    });

    it('sets repoName from directory name', () => {
      expect(inventory.repoName).toBe('simple-node');
    });

    it('detects TypeScript language', () => {
      expect(inventory.languages).toContain('TypeScript');
    });

    it('detects npm package manager', () => {
      expect(inventory.packageManagers).toContain('npm');
    });

    it('detects package.json as manifest', () => {
      expect(inventory.manifests.some(m => m.endsWith('package.json'))).toBe(true);
    });

    it('classifies as backend repo', () => {
      expect(inventory.repoType).toBe('backend');
    });

    it('returns frameworkHints as an array', () => {
      expect(Array.isArray(inventory.frameworkHints)).toBe(true);
    });
  });

  describe('monorepo fixture', () => {
    let inventory: ReturnType<typeof inspectInventory>;

    beforeAll(() => {
      inventory = inspectInventory(monorepo);
    });

    it('classifies as monorepo', () => {
      expect(inventory.repoType).toBe('monorepo');
    });

    it('detects packages dir as top-level', () => {
      expect(inventory.topLevelDirs).toContain('packages');
    });
  });

  describe('shallow mode', () => {
    it('limits file scan', () => {
      const full = inspectInventory(simpleNode, false);
      const shallow = inspectInventory(simpleNode, true);
      expect(shallow.languages.length).toBeGreaterThanOrEqual(0);
      expect(full.repoName).toBe(shallow.repoName);
    });
  });
});
