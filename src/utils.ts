import * as fs from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';

export function ensureDir(dir: string): void {
  fs.mkdirSync(dir, { recursive: true });
}

export function writeJson(filePath: string, data: unknown): void {
  ensureDir(path.dirname(filePath));
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
}

export function writeText(filePath: string, content: string): void {
  ensureDir(path.dirname(filePath));
  fs.writeFileSync(filePath, content, 'utf8');
}

export function readJson<T>(filePath: string): T {
  return JSON.parse(fs.readFileSync(filePath, 'utf8')) as T;
}

/** Shared file-count limits used across all inspectors. */
export const FILE_LIMITS = {
  /** Shallow / fast pass. */
  shallow: 300,
  /** Standard inspector depth. */
  standard: 1000,
  /** Import-graph scan. */
  graph: 500,
  /** Full deep scan (default when not shallow). */
  deep: 3000,
} as const;

export function listFilesRecursive(root: string, options?: {
  shallow?: boolean;
  maxFiles?: number;
  onTruncated?: (limit: number) => void;
}): string[] {
  const maxFiles = options?.maxFiles ?? (options?.shallow ? FILE_LIMITS.shallow : FILE_LIMITS.deep);
  const results: string[] = [];
  const ignoredDirs = new Set(['.git', 'node_modules', 'dist', 'build', '.next', '.dart_tool', 'coverage', '.turbo', '.idea', '.vscode']);

  function walk(current: string): void {
    if (results.length >= maxFiles) return;
    for (const entry of fs.readdirSync(current, { withFileTypes: true })) {
      if (results.length >= maxFiles) return;
      const full = path.join(current, entry.name);
      const rel = path.relative(root, full) || entry.name;
      if (entry.isDirectory()) {
        if (!ignoredDirs.has(entry.name)) walk(full);
      } else {
        results.push(rel);
      }
    }
  }

  walk(root);
  if (results.length >= maxFiles && options?.onTruncated) {
    options.onTruncated(maxFiles);
  }
  return results.sort();
}

export function detectLanguageFromExtension(file: string): string | null {
  const ext = path.extname(file).toLowerCase();
  const map: Record<string, string> = {
    '.ts': 'TypeScript',
    '.tsx': 'TypeScript',
    '.js': 'JavaScript',
    '.jsx': 'JavaScript',
    '.dart': 'Dart',
    '.py': 'Python',
    '.go': 'Go',
    '.rs': 'Rust',
    '.java': 'Java',
    '.kt': 'Kotlin',
    '.swift': 'Swift',
    '.php': 'PHP',
    '.rb': 'Ruby',
    '.cs': 'C#',
    '.cpp': 'C++',
    '.c': 'C',
    '.h': 'C/C++ Header',
    '.html': 'HTML',
    '.css': 'CSS',
    '.scss': 'SCSS',
    '.sql': 'SQL',
    '.sh': 'Shell',
    '.yaml': 'YAML',
    '.yml': 'YAML',
    '.json': 'JSON',
    '.md': 'Markdown'
  };
  return map[ext] ?? null;
}

export function uniq(values: string[]): string[] {
  return [...new Set(values.filter(Boolean))].sort();
}

export function readTextSafe(filePath: string): string {
  try {
    return fs.readFileSync(filePath, 'utf8');
  } catch {
    return '';
  }
}

export function fileExists(filePath: string): boolean {
  return fs.existsSync(filePath);
}

export function run(command: string, cwd?: string): string {
  return execSync(command, { cwd, stdio: ['ignore', 'pipe', 'pipe'] }).toString('utf8').trim();
}

export function sanitizeName(input: string): string {
  return input.replace(/[^a-zA-Z0-9._-]/g, '-');
}
