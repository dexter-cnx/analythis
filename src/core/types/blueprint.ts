import type { RepoType } from './inventory';
import type { RuleResult } from '../../rules/types';

export type { RuleResult };

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

export interface DetectedProfileSummary {
  primary: string;
  primaryConfidence: number;
  primaryReasons: string[];
  secondary: string[];
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
  /** Human-readable risk strings (derived from rule_findings + heuristic inspector). */
  risks: string[];
  /** Human-readable refactor suggestions (derived from rule_findings + heuristic inspector). */
  refactor_opportunities: string[];
  open_questions: string[];
  /** Structured rule engine findings. */
  rule_findings: RuleResult[];
  /** Detected profile information. */
  detected_profiles: DetectedProfileSummary;
  /** @deprecated Use detected_profiles.primary instead. Kept for backward compat. */
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
