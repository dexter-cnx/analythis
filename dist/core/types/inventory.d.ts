export type RepoType = 'flutter' | 'backend' | 'web' | 'mobile' | 'library' | 'monorepo' | 'fullstack' | 'unknown';
export type ProfileName = 'generic' | 'web' | 'backend' | 'mobile' | 'monorepo' | 'library';
export interface Inventory {
    repoName: string;
    repoRoot: string;
    repoType: RepoType;
    rootFiles: string[];
    topLevelDirs: string[];
    languages: string[];
    manifests: string[];
    entryPoints: string[];
    testLocations: string[];
    ciFiles: string[];
    infraFiles: string[];
    notableFiles: string[];
    packageManagers: string[];
    frameworkHints: string[];
}
