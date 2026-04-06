import type { AnalysisProfile, ProfileName } from './types';
import { genericProfile } from './generic.profile';
import { webProfile } from './web.profile';
import { backendProfile } from './backend.profile';
import { mobileProfile } from './mobile.profile';
import { monorepoProfile } from './monorepo.profile';
import { libraryProfile } from './library.profile';

const registry: AnalysisProfile[] = [
  genericProfile,
  webProfile,
  backendProfile,
  mobileProfile,
  monorepoProfile,
  libraryProfile
];

const profileMap = new Map<ProfileName, AnalysisProfile>(registry.map((p) => [p.id, p]));

export function getProfile(id: ProfileName): AnalysisProfile {
  const profile = profileMap.get(id);
  if (!profile) throw new Error(`Unknown profile: "${id}"`);
  return profile;
}

export function getAllProfiles(): AnalysisProfile[] {
  return [...registry];
}

/**
 * Register a custom profile at runtime. Useful for extending analythis
 * without forking the core registry.
 */
export function registerProfile(profile: AnalysisProfile): void {
  if (profileMap.has(profile.id)) {
    const idx = registry.findIndex((p) => p.id === profile.id);
    if (idx !== -1) registry[idx] = profile;
  } else {
    registry.push(profile);
  }
  profileMap.set(profile.id, profile);
}
