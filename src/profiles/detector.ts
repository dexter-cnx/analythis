import type { Inventory, ProfileName } from '../core/types/inventory';
import type { AnalysisProfile, ProfileMatch, ProfileSelectionResult } from './types';
import { getAllProfiles } from './registry';

/**
 * Minimum absolute score a non-generic profile must reach to be
 * considered a real match (prevents random signal noise from winning).
 */
const MIN_SCORE_TO_WIN = 5;

/** Minimum absolute score for a profile to appear as a secondary match. */
const SECONDARY_MIN_SCORE = 3;

/**
 * Detect the best-fitting profiles for a repository.
 *
 * Profiles are ranked by their absolute signal score (sum of matched
 * signal weights). The generic profile acts as a fallback and is only
 * selected as primary when no other profile reaches MIN_SCORE_TO_WIN.
 *
 * @param inventory  Scanned repository inventory.
 * @param hint       Optional profile name from CLI --profile flag; boosts
 *                   that profile to primary when tied with the auto-detected
 *                   winner.
 */
export function detectProfile(inventory: Inventory, hint?: ProfileName): ProfileSelectionResult {
  const profiles = getAllProfiles();
  const matches = profiles.map((p) => scoreProfile(p, inventory));

  // Sort non-generic profiles by absolute score descending, then alphabetically
  const nonGeneric = matches
    .filter((m) => m.profile.id !== 'generic')
    .sort((a, b) => b.score - a.score || a.profile.id.localeCompare(b.profile.id));

  const genericMatch = matches.find((m) => m.profile.id === 'generic')!;

  // Determine primary: best non-generic if it clears the threshold, else generic
  let ranked: ProfileMatch[];
  if (nonGeneric.length > 0 && nonGeneric[0].score >= MIN_SCORE_TO_WIN) {
    ranked = [...nonGeneric, genericMatch];
  } else {
    ranked = [genericMatch, ...nonGeneric];
  }

  // If a CLI hint is provided and it's not already #1, promote it
  if (hint && hint !== 'generic') {
    const hintIdx = ranked.findIndex((m) => m.profile.id === hint);
    if (hintIdx > 0) {
      const [promoted] = ranked.splice(hintIdx, 1);
      ranked.unshift(promoted);
    }
  }

  const primary = ranked[0];
  const secondary = ranked
    .slice(1)
    .filter((m) => m.profile.id !== 'generic' && m.score >= SECONDARY_MIN_SCORE);

  // allMatches should still be sorted by score descending for callers
  const allMatches = [...nonGeneric, genericMatch];
  if (allMatches[0].score < MIN_SCORE_TO_WIN) {
    allMatches.unshift(allMatches.splice(allMatches.findIndex((m) => m.profile.id === 'generic'), 1)[0]);
  }

  return { primary, secondary, allMatches: ranked };
}

function scoreProfile(profile: AnalysisProfile, inventory: Inventory): ProfileMatch {
  let score = 0;
  const maxScore = profile.signals.reduce((acc, s) => acc + s.weight, 0);
  const reasons: string[] = [];
  const matchedSignals: string[] = [];

  for (const signal of profile.signals) {
    const raw = signal.test(inventory);
    const contribution = typeof raw === 'number' ? Math.min(raw, signal.weight) : raw ? signal.weight : 0;
    if (contribution > 0) {
      score += contribution;
      reasons.push(signal.description);
      matchedSignals.push(signal.id);
    }
  }

  const confidence = maxScore > 0 ? Math.min(score / maxScore, 1) : 0;
  return { profile, score, maxScore, confidence, reasons, matchedSignals };
}
