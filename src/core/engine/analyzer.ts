import type { AnalyzeOptions } from '../types/options';
import type { Blueprint, PromptPack } from '../types/blueprint';
import type { Inventory } from '../types/inventory';
import { inspectArchitecture, inspectModules } from '../../inspectors/architecture-inspector';
import { inspectEntities, inspectUseCases } from '../../inspectors/domain-inspector';
import { inspectApiSurfaces, inspectEvents } from '../../inspectors/interface-inspector';
import { inspectDependencies, inspectConfiguration } from '../../inspectors/manifest-inspector';
import { inspectInventory } from '../../inspectors/inventory-inspector';
import { inspectRefactorOpportunities, inspectRisks } from '../../inspectors/risk-inspector';

export function analyzeRepository(repoRoot: string, options: AnalyzeOptions): { inventory: Inventory; blueprint: Blueprint; promptPack: PromptPack } {
  const inventory = inspectInventory(repoRoot, options.shallow);
  const architecture = inspectArchitecture(inventory, options.profile);
  const modules = inspectModules(inventory);
  const entities = inspectEntities(repoRoot, inventory, options.shallow);
  const use_cases = inspectUseCases(repoRoot, inventory, options.shallow);
  const api_surfaces = inspectApiSurfaces(inventory);
  const events = inspectEvents(inventory);
  const dependencies = inspectDependencies(repoRoot, inventory);
  const configuration = inspectConfiguration(repoRoot, inventory);
  const reusable_foundations = inferReusableFoundations(entities, modules, inventory, options.focusAreas);
  const app_specific_logic = inferAppSpecificLogic(entities, reusable_foundations);

  const partial = {
    architecture,
    modules,
    entities,
    use_cases,
    api_surfaces,
    events,
    dependencies,
    configuration
  };

  const risks = inspectRisks(inventory, partial);
  const refactor_opportunities = inspectRefactorOpportunities(inventory, partial);

  const blueprint: Blueprint = {
    project_name: inventory.repoName,
    repo_type: inventory.repoType,
    summary: summarize(inventory, modules, entities, api_surfaces),
    architecture,
    modules,
    entities,
    use_cases,
    api_surfaces,
    events,
    dependencies,
    configuration,
    reusable_foundations,
    app_specific_logic,
    risks,
    refactor_opportunities,
    open_questions: inferOpenQuestions(inventory, api_surfaces),
    profile: options.profile,
    focus_areas: options.focusAreas,
    generated_at: new Date().toISOString()
  };

  const promptPack = buildPromptPack(blueprint);
  return { inventory, blueprint, promptPack };
}

function summarize(inventory: Inventory, modules: Blueprint['modules'], entities: Blueprint['entities'], apis: Blueprint['api_surfaces']): string {
  const moduleNames = modules.map((m) => m.name).join(', ');
  const entityNames = entities.slice(0, 5).map((e) => e.name).join(', ') || 'no clear entities';
  const apiNames = apis.map((a) => a.type).join(', ');
  return `${inventory.repoName} appears to be a ${inventory.repoType} repository with modules ${moduleNames}. Likely domain entities include ${entityNames}. External interfaces detected: ${apiNames}.`;
}

function inferReusableFoundations(
  entities: Blueprint['entities'],
  modules: Blueprint['modules'],
  inventory: Inventory,
  focusAreas: string[]
): string[] {
  const foundations = new Set<string>();
  const entityNames = entities.map((e) => e.name.toLowerCase());
  const moduleNames = modules.map((m) => m.name.toLowerCase());
  const joined = `${entityNames.join(' ')} ${moduleNames.join(' ')} ${focusAreas.join(' ')} ${inventory.topLevelDirs.join(' ')}`.toLowerCase();

  const candidates = ['auth', 'user management', 'audit', 'rbac', 'notifications', 'queue/jobs', 'reporting', 'configuration'];
  for (const candidate of candidates) {
    const normalized = candidate.replace('/', ' ');
    if (joined.includes(normalized.split(' ')[0])) foundations.add(candidate);
  }
  if (joined.includes('customer')) foundations.add('customer base model');
  if (joined.includes('product') || joined.includes('inventory')) foundations.add('catalog/inventory primitives');
  if (joined.includes('payment') || joined.includes('invoice')) foundations.add('billing/payment primitives');

  return [...foundations].sort();
}

function inferAppSpecificLogic(entities: Blueprint['entities'], reusable: string[]): string[] {
  const reusableWords = reusable.join(' ').toLowerCase();
  return entities
    .map((e) => e.name)
    .filter((name) => !reusableWords.includes(name.toLowerCase()))
    .slice(0, 10);
}

function inferOpenQuestions(inventory: Inventory, api_surfaces: Blueprint['api_surfaces']): string[] {
  const questions: string[] = [];
  if (!inventory.testLocations.length) questions.push('What test strategy should cover the highest-risk modules?');
  if (!inventory.ciFiles.length) questions.push('Should CI be added for build, test, and lint automation?');
  if (api_surfaces.some((a) => a.type === 'Unknown')) questions.push('What are the intended external interfaces of this repository?');
  return questions;
}

function buildPromptPack(blueprint: Blueprint): PromptPack {
  const focus = blueprint.focus_areas.length ? blueprint.focus_areas.join(', ') : 'the inferred architecture and domain';
  return {
    refactor: `Read .analythis/blueprint.json and refactor the project to align with the inferred architecture. Focus on ${focus}. Preserve behavior while improving boundaries, services, and contracts.`,
    regenerate: `Using .analythis/blueprint.json as source of truth, regenerate a clean starter for the same domain and interfaces. Keep reusable foundations and separate app-specific logic.`,
    extract_core: `Analyze .analythis/blueprint.json and separate reusable business foundations from app-specific logic. Propose package boundaries, interfaces, and migration order.`,
    onboard_team: `Read the blueprint and create a concise onboarding guide explaining the repository purpose, modules, entities, APIs, risks, and first safe changes for a new contributor.`
  };
}
