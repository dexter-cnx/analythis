import type { Blueprint } from '../types/blueprint';
import type { AnalyzeOptions } from '../types/options';
import { analyzeRepository } from './analyzer';

export interface RepoSnapshot {
  name: string;
  inputPath: string;
  blueprint: Blueprint;
  /** Languages detected in this repo (from inventory.languages). */
  languages: string[];
}

export interface ComparisonReport {
  repos: RepoSnapshot[];
  shared: {
    languages: string[];
    architectureStyles: string[];
    profiles: string[];
    risks: string[];
  };
  unique: Record<string, {
    languages: string[];
    architectureStyles: string[];
    modules: string[];
    risks: string[];
  }>;
  divergence: {
    profileMismatch: boolean;
    languageMismatch: boolean;
    architectureMismatch: boolean;
  };
  recommendation: string;
  generatedAt: string;
}

function intersection<T>(a: T[], b: T[]): T[] {
  const setB = new Set(b);
  return a.filter((v) => setB.has(v));
}

function difference<T>(a: T[], b: T[]): T[] {
  const setB = new Set(b);
  return a.filter((v) => !setB.has(v));
}

function sharedAcrossAll<T>(arrays: T[][]): T[] {
  if (arrays.length === 0) return [];
  return arrays.reduce((acc, cur) => intersection(acc, cur));
}

export function compareBlueprints(snapshots: RepoSnapshot[]): ComparisonReport {
  const languageArrays = snapshots.map((s) => s.languages);

  // We derive shared data from blueprint fields
  const styleArrays = snapshots.map((s) => s.blueprint.architecture.style);
  const profileArrays = snapshots.map((s) => [s.blueprint.detected_profiles.primary]);
  const riskArrays = snapshots.map((s) => s.blueprint.risks);

  const sharedProfiles = sharedAcrossAll(profileArrays);
  const sharedStyles = sharedAcrossAll(styleArrays);
  const sharedRisks = sharedAcrossAll(riskArrays);

  const unique: ComparisonReport['unique'] = {};
  for (const snap of snapshots) {
    const otherStyles = snapshots
      .filter((s) => s.name !== snap.name)
      .flatMap((s) => s.blueprint.architecture.style);
    const otherModules = snapshots
      .filter((s) => s.name !== snap.name)
      .flatMap((s) => s.blueprint.modules.map((m) => m.name));
    const otherRisks = snapshots
      .filter((s) => s.name !== snap.name)
      .flatMap((s) => s.blueprint.risks);

    const otherLanguages = snapshots
      .filter((s) => s.name !== snap.name)
      .flatMap((s) => s.languages);

    unique[snap.name] = {
      languages: difference(snap.languages, otherLanguages),
      architectureStyles: difference(snap.blueprint.architecture.style, otherStyles),
      modules: difference(
        snap.blueprint.modules.map((m) => m.name),
        otherModules
      ),
      risks: difference(snap.blueprint.risks, otherRisks)
    };
  }

  const profiles = snapshots.map((s) => s.blueprint.detected_profiles.primary);
  const profileMismatch = new Set(profiles).size > 1;
  const styles = snapshots.map((s) => s.blueprint.architecture.style.join(','));
  const architectureMismatch = new Set(styles).size > 1;
  const allLangSets = snapshots.map((s) => s.languages.slice().sort().join(','));
  const languageMismatch = new Set(allLangSets).size > 1;

  const recommendation = buildRecommendation(snapshots, profileMismatch, architectureMismatch, sharedRisks);

  return {
    repos: snapshots,
    shared: {
      languages: sharedAcrossAll(languageArrays),
      architectureStyles: sharedStyles,
      profiles: sharedProfiles,
      risks: sharedRisks.slice(0, 5)
    },
    unique,
    divergence: {
      profileMismatch,
      languageMismatch,
      architectureMismatch
    },
    recommendation,
    generatedAt: new Date().toISOString()
  };
}

function buildRecommendation(
  snapshots: RepoSnapshot[],
  profileMismatch: boolean,
  architectureMismatch: boolean,
  sharedRisks: string[]
): string {
  const parts: string[] = [];

  if (profileMismatch) {
    const profiles = snapshots.map((s) => `${s.name}=${s.blueprint.detected_profiles.primary}`).join(', ');
    parts.push(`Repositories have different profiles (${profiles}). Consider whether integration or shared libraries are needed.`);
  } else {
    parts.push(`Repositories share the same profile (${snapshots[0].blueprint.detected_profiles.primary}). They can share architectural patterns and tooling.`);
  }

  if (architectureMismatch) {
    parts.push('Architecture styles diverge — align them before integrating these repositories.');
  }

  if (sharedRisks.length > 0) {
    parts.push(`Common risks across all repos: ${sharedRisks.slice(0, 2).join('; ')}.`);
  }

  const allModuleNames = snapshots.flatMap((s) => s.blueprint.modules.map((m) => m.name));
  const sharedModuleNames = sharedAcrossAll(snapshots.map((s) => s.blueprint.modules.map((m) => m.name)));
  if (sharedModuleNames.length > 0) {
    parts.push(`Modules ${sharedModuleNames.join(', ')} appear in all repos — consider extracting them as shared packages.`);
  }

  return parts.join(' ');
}

export async function runComparison(
  workingRoots: { name: string; root: string }[],
  options: Omit<AnalyzeOptions, 'outputDir' | 'verbose' | 'graph'>
): Promise<ComparisonReport> {
  const snapshots: RepoSnapshot[] = [];

  for (const { name, root } of workingRoots) {
    const result = analyzeRepository(root, {
      ...options,
      outputDir: '',
      verbose: false,
      graph: false
    });
    snapshots.push({
      name,
      inputPath: root,
      blueprint: result.blueprint,
      languages: result.inventory.languages
    });
  }

  return compareBlueprints(snapshots);
}
