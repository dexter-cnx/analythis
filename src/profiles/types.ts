import type { Inventory, ProfileName } from '../core/types/inventory';

export type { ProfileName };

export interface ProfileDetectionSignal {
  id: string;
  description: string;
  weight: number;
  test: (inventory: Inventory) => boolean | number;
}

export interface AnalysisProfile {
  id: ProfileName;
  title: string;
  description: string;
  signals: ProfileDetectionSignal[];
  inspectors: string[];
  ruleGroups: string[];
  heuristicStrategies: string[];
  weights: Record<string, number>;
}

export interface ProfileMatch {
  profile: AnalysisProfile;
  score: number;
  maxScore: number;
  /** Normalized 0–1 confidence derived from score / maxScore. */
  confidence: number;
  reasons: string[];
  matchedSignals: string[];
}

export interface ProfileSelectionResult {
  primary: ProfileMatch;
  secondary: ProfileMatch[];
  allMatches: ProfileMatch[];
}
