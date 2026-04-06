import * as fs from 'fs';
import * as path from 'path';
import type { Inventory, RepoType } from '../core/types/inventory';
import { detectLanguageFromExtension, listFilesRecursive, uniq } from '../utils';

export function inspectInventory(repoRoot: string, shallow = false): Inventory {
  const files = listFilesRecursive(repoRoot, { shallow });
  const rootEntries = fs.readdirSync(repoRoot, { withFileTypes: true });
  const rootFiles = rootEntries.filter((e) => e.isFile()).map((e) => e.name).sort();
  const topLevelDirs = rootEntries.filter((e) => e.isDirectory()).map((e) => e.name).sort();
  const manifests = files.filter((f) => /(^|\/)(package\.json|pubspec\.yaml|Cargo\.toml|pom\.xml|build\.gradle|go\.mod|requirements\.txt|pyproject\.toml|melos\.yaml)$/i.test(f));
  const entryPoints = files.filter((f) => /(^|\/)(main\.(dart|ts|tsx|js|jsx|py|go)|app\.(ts|tsx|js|jsx)|server\.(ts|js)|index\.(ts|tsx|js|jsx))$/i.test(f));
  const testLocations = uniq(files.filter((f) => /(^|\/)(test|tests|__tests__|spec)(\/|$)|\.(test|spec)\./i.test(f)).map((f) => f.split('/')[0]));
  const ciFiles = files.filter((f) => /(^|\/)(\.github\/workflows\/|gitlab-ci|azure-pipelines|Jenkinsfile|circleci)/i.test(f));
  const infraFiles = files.filter((f) => /Dockerfile|docker-compose|terraform|helm|k8s|kubectl|ansible/i.test(f));
  const notableFiles = files.filter((f) => /README|LICENSE|AGENTS\.md|CLAUDE\.md|analysis_options\.yaml|tsconfig\.json|next\.config|vite\.config|tailwind\.config/i.test(f));
  const languages = uniq(files.map(detectLanguageFromExtension).filter((v): v is string => Boolean(v)));
  const packageManagers = uniq([
    manifests.some((m) => m.endsWith('package.json')) ? 'npm' : '',
    manifests.some((m) => m.endsWith('pubspec.yaml')) ? 'pub' : '',
    manifests.some((m) => m.endsWith('go.mod')) ? 'go' : '',
    manifests.some((m) => m.endsWith('Cargo.toml')) ? 'cargo' : '',
    manifests.some((m) => m.endsWith('requirements.txt') || m.endsWith('pyproject.toml')) ? 'pip' : ''
  ]);
  const frameworkHints = detectFrameworkHints(files);
  const repoType = inferRepoType(files, frameworkHints, topLevelDirs, languages);

  return {
    repoName: path.basename(repoRoot),
    repoRoot,
    repoType,
    rootFiles,
    topLevelDirs,
    languages,
    manifests,
    entryPoints,
    testLocations,
    ciFiles,
    infraFiles,
    notableFiles,
    packageManagers,
    frameworkHints
  };
}

function detectFrameworkHints(files: string[]): string[] {
  const hints: string[] = [];
  if (files.includes('pubspec.yaml')) hints.push('Flutter/Dart');
  if (files.includes('next.config.js') || files.includes('next.config.ts')) hints.push('Next.js');
  if (files.some((f) => /express|nest|koa/i.test(f))) hints.push('Node backend');
  if (files.includes('go.mod')) hints.push('Go');
  if (files.includes('Cargo.toml')) hints.push('Rust');
  if (files.includes('requirements.txt') || files.includes('pyproject.toml')) hints.push('Python');
  if (files.includes('pom.xml') || files.includes('build.gradle')) hints.push('JVM');
  if (files.includes('melos.yaml')) hints.push('Monorepo workspace');
  return uniq(hints);
}

function inferRepoType(files: string[], frameworkHints: string[], topLevelDirs: string[], languages: string[]): RepoType {
  const hasFlutter = files.includes('pubspec.yaml') && languages.includes('Dart');
  const hasMobileDirs = topLevelDirs.includes('android') || topLevelDirs.includes('ios');
  const hasBackend = files.some((f) => /server|api|controllers|routes|handlers|migrations/i.test(f));
  const hasWeb = files.some((f) => /next\.config|vite\.config|src\/pages|src\/app|public\//i.test(f));
  const hasWorkspace = files.includes('melos.yaml') || topLevelDirs.includes('packages') || topLevelDirs.includes('apps');

  if (hasWorkspace) return 'monorepo';
  if (hasFlutter && hasBackend) return 'fullstack';
  if (hasFlutter || hasMobileDirs) return 'mobile';
  if (hasBackend && !hasWeb) return 'backend';
  if (hasWeb && !hasBackend) return 'web';
  if (topLevelDirs.includes('src') && topLevelDirs.includes('examples') && !hasBackend && !hasWeb) return 'library';
  if (frameworkHints.includes('Monorepo workspace')) return 'monorepo';
  return 'unknown';
}
