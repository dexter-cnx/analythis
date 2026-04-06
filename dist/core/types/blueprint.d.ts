import type { RepoType } from './inventory';
export interface BlueprintModule {
    name: string;
    purpose: string;
    paths: string[];
    dependsOn: string[];
}
export interface BlueprintEntity {
    name: string;
    description: string;
    fields: string[];
    rules: string[];
}
export interface BlueprintUseCase {
    name: string;
    actors: string[];
    steps: string[];
    relatedEntities: string[];
}
export interface ApiSurface {
    type: string;
    name: string;
    details: string;
}
export interface BlueprintDependency {
    name: string;
    purpose: string;
    critical: boolean;
}
export interface Blueprint {
    project_name: string;
    repo_type: RepoType;
    summary: string;
    architecture: {
        style: string[];
        layers: string[];
        module_strategy: string;
        dependency_rules: string[];
    };
    modules: BlueprintModule[];
    entities: BlueprintEntity[];
    use_cases: BlueprintUseCase[];
    api_surfaces: ApiSurface[];
    events: string[];
    dependencies: BlueprintDependency[];
    configuration: string[];
    reusable_foundations: string[];
    app_specific_logic: string[];
    risks: string[];
    refactor_opportunities: string[];
    open_questions: string[];
    profile: string;
    focus_areas: string[];
    generated_at: string;
}
export interface PromptPack {
    refactor: string;
    regenerate: string;
    extract_core: string;
    onboard_team: string;
}
