import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { exportBlueprintYaml } from '../src/exporters/yaml';
import { exportInventoryMarkdown } from '../src/exporters/markdown';
import type { Blueprint } from '../src/core/types/blueprint';
import type { Inventory } from '../src/core/types/inventory';

function makeBlueprint(overrides: Partial<Blueprint> = {}): Blueprint {
  return {
    project_name: 'test-project',
    repo_type: 'backend',
    summary: 'A test project',
    architecture: { style: ['monolithic'], layers: [], module_strategy: '', dependency_rules: [] },
    modules: [],
    entities: [],
    use_cases: [],
    api_surfaces: [],
    events: [],
    dependencies: [],
    configuration: [],
    reusable_foundations: [],
    app_specific_logic: [],
    risks: [],
    refactor_opportunities: [],
    open_questions: [],
    rule_findings: [],
    detected_profiles: {
      primary: 'generic',
      primaryConfidence: 1,
      primaryReasons: [],
      secondary: []
    },
    profile: 'generic',
    focus_areas: [],
    generated_at: '2026-01-01T00:00:00.000Z',
    ...overrides,
  };
}

function makeInventory(overrides: Partial<Inventory> = {}): Inventory {
  return {
    repoName: 'test-project',
    repoRoot: '/tmp/test-project',
    repoType: 'backend',
    rootFiles: ['package.json', 'README.md'],
    topLevelDirs: ['src'],
    languages: ['TypeScript'],
    manifests: ['package.json'],
    entryPoints: ['src/server.ts'],
    testLocations: [],
    ciFiles: [],
    infraFiles: [],
    notableFiles: ['README.md'],
    packageManagers: ['npm'],
    frameworkHints: ['Node backend'],
    ...overrides,
  };
}

describe('exportBlueprintYaml', () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'analythis-test-'));
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it('creates blueprint.yaml', () => {
    exportBlueprintYaml(makeBlueprint(), tmpDir);
    expect(fs.existsSync(path.join(tmpDir, 'blueprint.yaml'))).toBe(true);
  });

  it('yaml contains project name', () => {
    exportBlueprintYaml(makeBlueprint({ project_name: 'my-app' }), tmpDir);
    const content = fs.readFileSync(path.join(tmpDir, 'blueprint.yaml'), 'utf8');
    expect(content).toContain('my-app');
  });

  it('yaml contains generated_at', () => {
    exportBlueprintYaml(makeBlueprint(), tmpDir);
    const content = fs.readFileSync(path.join(tmpDir, 'blueprint.yaml'), 'utf8');
    expect(content).toContain('generated_at');
  });
});

describe('exportInventoryMarkdown', () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'analythis-test-'));
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it('creates inventory.md', () => {
    exportInventoryMarkdown(makeInventory(), tmpDir);
    expect(fs.existsSync(path.join(tmpDir, 'reports', 'inventory.md'))).toBe(true);
  });

  it('markdown contains repo name', () => {
    exportInventoryMarkdown(makeInventory({ repoName: 'my-repo' }), tmpDir);
    const content = fs.readFileSync(path.join(tmpDir, 'reports', 'inventory.md'), 'utf8');
    expect(content).toContain('my-repo');
  });

  it('markdown contains detected language', () => {
    exportInventoryMarkdown(makeInventory({ languages: ['TypeScript'] }), tmpDir);
    const content = fs.readFileSync(path.join(tmpDir, 'reports', 'inventory.md'), 'utf8');
    expect(content).toContain('TypeScript');
  });
});
