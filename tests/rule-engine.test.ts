import { RuleEngine, allRules } from '../src/rules/index';
import type { AnalysisContext } from '../src/rules/types';
import type { Blueprint } from '../src/core/types/blueprint';
import type { Inventory } from '../src/core/types/inventory';
import type { ProfileSelectionResult } from '../src/profiles/types';
import { detectProfile } from '../src/profiles/detector';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeInventory(overrides: Partial<Inventory> = {}): Inventory {
  return {
    repoName: 'test',
    repoRoot: '/tmp/test',
    repoType: 'backend',
    rootFiles: [],
    topLevelDirs: ['src', 'routes'],
    languages: ['TypeScript'],
    manifests: ['package.json'],
    entryPoints: ['src/server.ts'],
    testLocations: [],
    ciFiles: [],
    infraFiles: [],
    notableFiles: [],
    packageManagers: ['npm'],
    frameworkHints: ['Node backend'],
    ...overrides
  };
}

function makeBlueprint(overrides: Partial<Blueprint> = {}): Blueprint {
  return {
    project_name: 'test',
    repo_type: 'backend',
    summary: 'Test project',
    architecture: {
      style: [],
      layers: [],
      module_strategy: 'directory-based',
      dependency_rules: []
    },
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
      primary: 'backend',
      primaryConfidence: 0.8,
      primaryReasons: ['Has server entry point'],
      secondary: []
    },
    profile: 'backend',
    focus_areas: [],
    generated_at: new Date().toISOString(),
    ...overrides
  };
}

function makeContext(
  inventoryOverrides: Partial<Inventory> = {},
  blueprintOverrides: Partial<Blueprint> = {}
): AnalysisContext {
  const inventory = makeInventory(inventoryOverrides);
  const blueprint = makeBlueprint(blueprintOverrides);
  const profileResult = detectProfile(inventory);
  return { inventory, blueprint, profileResult };
}

// ---------------------------------------------------------------------------
// RuleEngine
// ---------------------------------------------------------------------------

describe('RuleEngine', () => {
  const engine = new RuleEngine(allRules);

  it('runs without throwing on empty context', () => {
    const context = makeContext();
    expect(() => engine.run(context)).not.toThrow();
  });

  it('returns an array', () => {
    const context = makeContext();
    expect(Array.isArray(engine.run(context))).toBe(true);
  });

  it('sorts findings by severity (critical before low)', () => {
    // Construct a context that triggers multiple rules
    const inventory = makeInventory({ topLevelDirs: ['routes', 'controllers', 'src'] });
    const blueprint = makeBlueprint({
      modules: [
        { name: 'shared', purpose: 'Shared utilities', paths: ['shared'], dependsOn: [] },
        { name: 'api', purpose: 'API layer', paths: ['api'], dependsOn: ['shared', 'services', 'routes', 'auth'] },
        { name: 'services', purpose: 'Service layer', paths: ['services'], dependsOn: ['shared'] },
        { name: 'routes', purpose: 'Route layer', paths: ['routes'], dependsOn: ['shared'] },
        { name: 'auth', purpose: 'Auth layer', paths: ['auth'], dependsOn: ['shared'] }
      ]
    });
    const profileResult = detectProfile(inventory);
    const findings = engine.run({ inventory, blueprint, profileResult });
    const sevOrder = ['critical', 'high', 'medium', 'low', 'info'];
    for (let i = 1; i < findings.length; i++) {
      expect(sevOrder.indexOf(findings[i].severity)).toBeGreaterThanOrEqual(
        sevOrder.indexOf(findings[i - 1].severity)
      );
    }
  });

  it('skips disabled rules', () => {
    const disabledRule = { ...allRules[0], enabled: false };
    const engineWithDisabled = new RuleEngine([disabledRule]);
    const context = makeContext();
    const results = engineWithDisabled.run(context);
    expect(results).toHaveLength(0);
  });
});

// ---------------------------------------------------------------------------
// dep/no-cycles
// ---------------------------------------------------------------------------

describe('dep/no-cycles rule', () => {
  it('detects mutual dependency', () => {
    const blueprint = makeBlueprint({
      modules: [
        { name: 'a', purpose: 'Module A', paths: ['a'], dependsOn: ['b'] },
        { name: 'b', purpose: 'Module B', paths: ['b'], dependsOn: ['a'] }
      ]
    });
    const context = makeContext({}, blueprint);
    const engine = new RuleEngine(allRules);
    const findings = engine.run(context);
    const cycle = findings.find((f) => f.ruleId === 'dep/no-cycles');
    expect(cycle).toBeDefined();
    expect(cycle!.severity).toBe('high');
  });

  it('does not flag one-way dependency', () => {
    const blueprint = makeBlueprint({
      modules: [
        { name: 'a', purpose: 'A', paths: ['a'], dependsOn: ['b'] },
        { name: 'b', purpose: 'B', paths: ['b'], dependsOn: [] }
      ]
    });
    const context = makeContext({}, blueprint);
    const engine = new RuleEngine(allRules);
    const findings = engine.run(context);
    const cycle = findings.find((f) => f.ruleId === 'dep/no-cycles');
    expect(cycle).toBeUndefined();
  });
});

// ---------------------------------------------------------------------------
// dep/high-coupling
// ---------------------------------------------------------------------------

describe('dep/high-coupling rule', () => {
  it('flags module with >= 4 dependencies', () => {
    const blueprint = makeBlueprint({
      modules: [
        { name: 'mega', purpose: 'Big module', paths: ['mega'], dependsOn: ['a', 'b', 'c', 'd'] }
      ]
    });
    const context = makeContext({}, blueprint);
    const engine = new RuleEngine(allRules);
    const findings = engine.run(context);
    const finding = findings.find((f) => f.ruleId === 'dep/high-coupling');
    expect(finding).toBeDefined();
  });

  it('does not flag module with 3 dependencies', () => {
    const blueprint = makeBlueprint({
      modules: [
        { name: 'ok', purpose: 'Fine module', paths: ['ok'], dependsOn: ['a', 'b', 'c'] }
      ]
    });
    const context = makeContext({}, blueprint);
    const engine = new RuleEngine(allRules);
    const findings = engine.run(context);
    const finding = findings.find((f) => f.ruleId === 'dep/high-coupling');
    expect(finding).toBeUndefined();
  });
});

// ---------------------------------------------------------------------------
// arch/missing-service-layer
// ---------------------------------------------------------------------------

describe('arch/missing-service-layer rule', () => {
  it('flags backend with routes but no services', () => {
    const inventory = makeInventory({ topLevelDirs: ['routes', 'src'] });
    const blueprint = makeBlueprint({ modules: [] });
    const profileResult = detectProfile(makeInventory({
      topLevelDirs: ['routes'],
      entryPoints: ['src/server.ts'],
      frameworkHints: ['Node backend']
    }));
    const engine = new RuleEngine(allRules);
    const findings = engine.run({ inventory, blueprint, profileResult });
    const finding = findings.find((f) => f.ruleId === 'arch/missing-service-layer');
    expect(finding).toBeDefined();
  });

  it('does not flag backend that has a services dir', () => {
    const inventory = makeInventory({ topLevelDirs: ['routes', 'services', 'src'] });
    const blueprint = makeBlueprint({});
    const profileResult = detectProfile(inventory);
    const engine = new RuleEngine(allRules);
    const findings = engine.run({ inventory, blueprint, profileResult });
    const finding = findings.find((f) => f.ruleId === 'arch/missing-service-layer');
    expect(finding).toBeUndefined();
  });
});

// ---------------------------------------------------------------------------
// cross/auth-scatter
// ---------------------------------------------------------------------------

describe('cross/auth-scatter rule', () => {
  it('flags auth logic in >= 3 modules/entities', () => {
    const blueprint = makeBlueprint({
      modules: [
        { name: 'auth-service', purpose: 'Auth service', paths: ['auth-service'], dependsOn: [] },
        { name: 'jwt-middleware', purpose: 'JWT token handling', paths: ['middleware'], dependsOn: [] },
        { name: 'session-store', purpose: 'Session storage', paths: ['sessions'], dependsOn: [] }
      ],
      entities: []
    });
    const context = makeContext({}, blueprint);
    const engine = new RuleEngine(allRules);
    const findings = engine.run(context);
    const finding = findings.find((f) => f.ruleId === 'cross/auth-scatter');
    expect(finding).toBeDefined();
    expect(finding!.severity).toBe('high');
  });
});

// ---------------------------------------------------------------------------
// cross/config-scatter
// ---------------------------------------------------------------------------

describe('cross/config-scatter rule', () => {
  it('flags >= 4 config entries', () => {
    const blueprint = makeBlueprint({
      configuration: [
        '.env',
        'config/database.ts',
        'config/app.config.json',
        'settings.yaml',
        'src/config.ts'
      ]
    });
    const context = makeContext({}, blueprint);
    const engine = new RuleEngine(allRules);
    const findings = engine.run(context);
    const finding = findings.find((f) => f.ruleId === 'cross/config-scatter');
    expect(finding).toBeDefined();
  });

  it('does not flag fewer than 4 config files', () => {
    const blueprint = makeBlueprint({ configuration: ['.env', 'config.ts'] });
    const context = makeContext({}, blueprint);
    const engine = new RuleEngine(allRules);
    const findings = engine.run(context);
    const finding = findings.find((f) => f.ruleId === 'cross/config-scatter');
    expect(finding).toBeUndefined();
  });
});
