"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.analyzeRepository = analyzeRepository;
const architecture_inspector_1 = require("../../inspectors/architecture-inspector");
const domain_inspector_1 = require("../../inspectors/domain-inspector");
const interface_inspector_1 = require("../../inspectors/interface-inspector");
const manifest_inspector_1 = require("../../inspectors/manifest-inspector");
const inventory_inspector_1 = require("../../inspectors/inventory-inspector");
const risk_inspector_1 = require("../../inspectors/risk-inspector");
const detector_1 = require("../../profiles/detector");
const index_1 = require("../../rules/index");
const semantic_inspector_1 = require("../../inspectors/semantic-inspector");
const config_1 = require("../../llm/config");
function analyzeRepository(repoRoot, options) {
    const inventory = (0, inventory_inspector_1.inspectInventory)(repoRoot, options.shallow);
    // --- Profile detection ---
    const profileResult = (0, detector_1.detectProfile)(inventory, options.profile);
    const primaryProfileName = profileResult.primary.profile.id;
    // Load custom domain keywords from .analythisrc.json
    const rc = (0, config_1.readRcConfig)();
    const extraKeywords = (rc?.domainKeywords ?? []).map(({ pattern, label }) => {
        try {
            return [new RegExp(pattern, 'i'), label];
        }
        catch {
            console.warn(`analythis: Invalid domainKeywords pattern "${pattern}" in .analythisrc.json — skipped.`);
            return null;
        }
    }).filter((entry) => entry !== null);
    // --- Structural inspectors ---
    const architecture = (0, architecture_inspector_1.inspectArchitecture)(inventory, primaryProfileName);
    const rawModules = (0, architecture_inspector_1.inspectModules)(inventory);
    const modules = (0, semantic_inspector_1.enrichModulesWithSemantics)(rawModules, repoRoot, options.shallow, extraKeywords);
    const entities = (0, domain_inspector_1.inspectEntities)(repoRoot, inventory, options.shallow);
    const use_cases = (0, domain_inspector_1.inspectUseCases)(repoRoot, inventory, options.shallow);
    const api_surfaces = (0, interface_inspector_1.inspectApiSurfaces)(inventory);
    const events = (0, interface_inspector_1.inspectEvents)(inventory);
    const dependencies = (0, manifest_inspector_1.inspectDependencies)(repoRoot, inventory);
    const configuration = (0, manifest_inspector_1.inspectConfiguration)(repoRoot, inventory);
    const reusable_foundations = inferReusableFoundations(entities, modules, inventory, options.focusAreas);
    const app_specific_logic = inferAppSpecificLogic(entities, reusable_foundations);
    const partial = { architecture, modules, entities, use_cases, api_surfaces, events, dependencies, configuration };
    // --- Heuristic risk inspector (string-based, kept for compat) ---
    const heuristicRisks = (0, risk_inspector_1.inspectRisks)(inventory, partial);
    const heuristicRefactor = (0, risk_inspector_1.inspectRefactorOpportunities)(inventory, partial);
    // --- Rule engine (structured findings) ---
    const preBlueprint = {
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
    const ruleFindings = index_1.defaultRuleEngine.run({
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
    const blueprint = {
        ...preBlueprint,
        risks: [...new Set([...heuristicRisks, ...ruleRisks])],
        refactor_opportunities: [...new Set([...heuristicRefactor, ...ruleRefactor])],
        rule_findings: ruleFindings
    };
    const promptPack = buildPromptPack(blueprint, profileResult);
    return { inventory, blueprint, promptPack };
}
function buildDetectedProfileSummary(result) {
    return {
        primary: result.primary.profile.id,
        primaryConfidence: Math.round(result.primary.confidence * 100) / 100,
        primaryReasons: result.primary.reasons,
        secondary: result.secondary.map((m) => m.profile.id)
    };
}
function summarize(inventory, modules, entities, apis) {
    const moduleNames = modules.map((m) => m.name).join(', ');
    const entityNames = entities.slice(0, 5).map((e) => e.name).join(', ') || 'no clear entities';
    const apiNames = apis.map((a) => a.type).join(', ');
    return `${inventory.repoName} appears to be a ${inventory.repoType} repository with modules ${moduleNames}. Likely domain entities include ${entityNames}. External interfaces detected: ${apiNames}.`;
}
function inferReusableFoundations(entities, modules, inventory, focusAreas) {
    const foundations = new Set();
    const entityNames = entities.map((e) => e.name.toLowerCase());
    const moduleNames = modules.map((m) => m.name.toLowerCase());
    const joined = `${entityNames.join(' ')} ${moduleNames.join(' ')} ${focusAreas.join(' ')} ${inventory.topLevelDirs.join(' ')}`.toLowerCase();
    const candidates = ['auth', 'user management', 'audit', 'rbac', 'notifications', 'queue/jobs', 'reporting', 'configuration'];
    for (const candidate of candidates) {
        const normalized = candidate.replace('/', ' ');
        if (joined.includes(normalized.split(' ')[0]))
            foundations.add(candidate);
    }
    if (joined.includes('customer'))
        foundations.add('customer base model');
    if (joined.includes('product') || joined.includes('inventory'))
        foundations.add('catalog/inventory primitives');
    if (joined.includes('payment') || joined.includes('invoice'))
        foundations.add('billing/payment primitives');
    return [...foundations].sort();
}
function inferAppSpecificLogic(entities, reusable) {
    const reusableWords = reusable.join(' ').toLowerCase();
    return entities
        .map((e) => e.name)
        .filter((name) => !reusableWords.includes(name.toLowerCase()))
        .slice(0, 10);
}
function inferOpenQuestions(inventory, api_surfaces) {
    const questions = [];
    if (!inventory.testLocations.length)
        questions.push('What test strategy should cover the highest-risk modules?');
    if (!inventory.ciFiles.length)
        questions.push('Should CI be added for build, test, and lint automation?');
    if (api_surfaces.some((a) => a.type === 'Unknown'))
        questions.push('What are the intended external interfaces of this repository?');
    return questions;
}
function buildPromptPack(blueprint, profileResult) {
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
