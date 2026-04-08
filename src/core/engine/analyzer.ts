import type { AnalyzeOptions } from '../types/options';
import type { Blueprint, DetectedProfileSummary, PromptPack } from '../types/blueprint';
import type { Inventory } from '../types/inventory';
import type { RuleResult } from '../../rules/types';
import type { ProfileSelectionResult } from '../../profiles/types';
import { inspectArchitecture, inspectModules } from '../../inspectors/architecture-inspector';
import { inspectEntities, inspectUseCases } from '../../inspectors/domain-inspector';
import { inspectApiSurfaces, inspectEvents } from '../../inspectors/interface-inspector';
import { inspectDependencies, inspectConfiguration } from '../../inspectors/manifest-inspector';
import { inspectInventory } from '../../inspectors/inventory-inspector';
import { inspectRefactorOpportunities, inspectRisks } from '../../inspectors/risk-inspector';
import { detectProfile } from '../../profiles/detector';
import { defaultRuleEngine } from '../../rules/index';
import { enrichModulesWithSemantics } from '../../inspectors/semantic-inspector';
import { readRcConfig } from '../../llm/config';

export function analyzeRepository(
  repoRoot: string,
  options: AnalyzeOptions
): { inventory: Inventory; blueprint: Blueprint; promptPack: PromptPack } {
  const inventory = inspectInventory(repoRoot, options.shallow);

  // --- Profile detection ---
  const profileResult = detectProfile(inventory, options.profile);
  const primaryProfileName = profileResult.primary.profile.id;

  // Load custom domain keywords from .analythisrc.json
  const rc = readRcConfig();
  const extraKeywords: [RegExp, string][] = (rc?.domainKeywords ?? []).map(({ pattern, label }) => {
    try {
      return [new RegExp(pattern, 'i'), label] as [RegExp, string];
    } catch {
      console.warn(`analythis: Invalid domainKeywords pattern "${pattern}" in .analythisrc.json — skipped.`);
      return null;
    }
  }).filter((entry): entry is [RegExp, string] => entry !== null);

  // --- Structural inspectors ---
  const architecture = inspectArchitecture(inventory, primaryProfileName);
  const rawModules = inspectModules(inventory);
  const modules = enrichModulesWithSemantics(rawModules, repoRoot, options.shallow, extraKeywords);
  const entities = inspectEntities(repoRoot, inventory, options.shallow);
  const use_cases = inspectUseCases(repoRoot, inventory, options.shallow);
  const api_surfaces = inspectApiSurfaces(inventory);
  const events = inspectEvents(inventory);
  const dependencies = inspectDependencies(repoRoot, inventory);
  const configuration = inspectConfiguration(repoRoot, inventory);
  const reusable_foundations = inferReusableFoundations(entities, modules, inventory, options.focusAreas);
  const app_specific_logic = inferAppSpecificLogic(entities, reusable_foundations);

  const partial = { architecture, modules, entities, use_cases, api_surfaces, events, dependencies, configuration };

  // --- Heuristic risk inspector (string-based, kept for compat) ---
  const heuristicRisks = inspectRisks(inventory, partial);
  const heuristicRefactor = inspectRefactorOpportunities(inventory, partial);

  // --- Rule engine (structured findings) ---
  const preBlueprint: Blueprint = {
    project_name: inventory.repoName,
    repo_type: inventory.repoType,
    summary: summarize(inventory, modules, entities, api_surfaces),
    ...partial,
    reusable_foundations,
    app_specific_logic,
    risks: heuristicRisks,
    refactor_opportunities: heuristicRefactor,
    open_questions: inferOpenQuestions(inventory, api_surfaces),
    rule_findings: [],
    detected_profiles: buildDetectedProfileSummary(profileResult),
    profile: primaryProfileName,
    focus_areas: options.focusAreas,
    generated_at: new Date().toISOString()
  };

  const ruleFindings: RuleResult[] = defaultRuleEngine.run({
    inventory,
    blueprint: preBlueprint,
    profileResult
  });

  // Merge rule findings into human-readable risk/refactor lists
  const ruleRisks = ruleFindings
    .filter((f) => ['critical', 'high', 'medium'].includes(f.severity))
    .map((f) => `[${f.severity.toUpperCase()}] ${f.summary}`);

  const ruleRefactor = ruleFindings
    .filter((f) => f.suggestions.length > 0)
    .flatMap((f) => f.suggestions.slice(0, 1)); // take the top suggestion per finding

  const blueprint: Blueprint = {
    ...preBlueprint,
    risks: [...new Set([...heuristicRisks, ...ruleRisks])],
    refactor_opportunities: [...new Set([...heuristicRefactor, ...ruleRefactor])],
    rule_findings: ruleFindings
  };

  const promptPack = buildPromptPack(blueprint, profileResult);
  return { inventory, blueprint, promptPack };
}

function buildDetectedProfileSummary(result: ProfileSelectionResult): DetectedProfileSummary {
  return {
    primary: result.primary.profile.id,
    primaryConfidence: Math.round(result.primary.confidence * 100) / 100,
    primaryReasons: result.primary.reasons,
    secondary: result.secondary.map((m) => m.profile.id)
  };
}

function summarize(
  inventory: Inventory,
  modules: Blueprint['modules'],
  entities: Blueprint['entities'],
  apis: Blueprint['api_surfaces']
): string {
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

function buildPromptPack(blueprint: Blueprint, profileResult: ProfileSelectionResult): PromptPack {
  const focus = blueprint.focus_areas.length ? blueprint.focus_areas.join(', ') : 'the inferred architecture and domain';
  const topRisks = blueprint.rule_findings.slice(0, 3).map((f) => f.summary).join('; ') || 'no critical findings';
  const profile = profileResult.primary.profile.title;

  return {
    refactor: `Read .analythis/blueprint.json. The repository is detected as a ${profile}. ` +
      `Top findings: ${topRisks}. ` +
      `Refactor the project to align with the inferred architecture. Focus on ${focus}. Preserve behaviour while improving boundaries, services, and contracts.`,
    regenerate: `Using .analythis/blueprint.json as source of truth, regenerate a clean starter for the same domain and interfaces. ` +
      `Detected profile: ${profile}. Keep reusable foundations (${blueprint.reusable_foundations.join(', ') || 'none'}) and separate app-specific logic.`,
    extract_core: `Analyze .analythis/blueprint.json and separate reusable business foundations from app-specific logic. ` +
      `Reusable: ${blueprint.reusable_foundations.join(', ') || 'none'}. ` +
      `Propose package boundaries, interfaces, and migration order.`,
    onboard_team: `Read the blueprint and create a concise onboarding guide explaining the repository purpose, modules, entities, APIs, risks, and first safe changes for a new contributor. ` +
      `Profile: ${profile}. Modules: ${blueprint.modules.map((m) => m.name).join(', ')}.`
  };
}
