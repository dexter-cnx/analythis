import type { Inventory } from '../core/types/inventory';
import type { Blueprint } from '../core/types/blueprint';
import type { ProfileName, ProfileSelectionResult } from '../profiles/types';

export type RiskSeverity = 'critical' | 'high' | 'medium' | 'low' | 'info';

export interface RuleResult {
  ruleId: string;
  title: string;
  severity: RiskSeverity;
  summary: string;
  details: string;
  affectedPaths: string[];
  suggestions: string[];
}

export interface AnalysisContext {
  inventory: Inventory;
  blueprint: Blueprint;
  profileResult: ProfileSelectionResult;
}

export interface AnalysisRule {
  id: string;
  title: string;
  description: string;
  /** Default severity when no result-level override is set. */
  severity: RiskSeverity;
  /** Rule group tags for filtering (e.g. 'dependency', 'architecture', 'structure'). */
  ruleGroups: string[];
  /**
   * Profiles this rule applies to. Empty array = applies to ALL profiles.
   * Use the primary profile id to restrict.
   */
  profiles: ProfileName[];
  enabled: boolean;
  evaluate: (context: AnalysisContext) => RuleResult[];
}
