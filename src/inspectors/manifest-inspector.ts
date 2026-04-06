import * as path from 'path';
import type { BlueprintDependency, Blueprint } from '../core/types/blueprint';
import type { Inventory } from '../core/types/inventory';
import { fileExists, readTextSafe, uniq } from '../utils';

export function inspectDependencies(repoRoot: string, inventory: Inventory): BlueprintDependency[] {
  const deps: BlueprintDependency[] = [];

  const packageJsonPath = path.join(repoRoot, 'package.json');
  if (fileExists(packageJsonPath)) {
    try {
      const pkg = JSON.parse(readTextSafe(packageJsonPath)) as {
        dependencies?: Record<string, string>;
        devDependencies?: Record<string, string>;
      };
      for (const [name] of Object.entries(pkg.dependencies ?? {})) {
        deps.push({ name, purpose: inferDependencyPurpose(name), critical: isCriticalDependency(name) });
      }
    } catch {}
  }

  const pubspecPath = path.join(repoRoot, 'pubspec.yaml');
  if (fileExists(pubspecPath)) {
    const content = readTextSafe(pubspecPath);
    const lines = content.split(/\r?\n/);
    let inDependencies = false;
    for (const line of lines) {
      if (/^dependencies:\s*$/.test(line)) {
        inDependencies = true;
        continue;
      }
      if (/^[A-Za-z_]+:\s*$/.test(line) && !/^\s+/.test(line) && !/^dependencies:\s*$/.test(line)) {
        inDependencies = false;
      }
      if (inDependencies) {
        const match = line.match(/^\s{2,}([a-zA-Z0-9_\-]+):/);
        if (match) {
          const name = match[1];
          deps.push({ name, purpose: inferDependencyPurpose(name), critical: isCriticalDependency(name) });
        }
      }
    }
  }

  return uniqByName(deps);
}

export function inspectConfiguration(repoRoot: string, inventory: Inventory): string[] {
  const config: string[] = [];
  const fileCandidates = [
    '.env',
    '.env.example',
    '.env.local',
    'docker-compose.yml',
    'docker-compose.yaml',
    'analysis_options.yaml',
    'tsconfig.json',
    'vite.config.ts',
    'vite.config.js',
    'next.config.js',
    'next.config.ts',
    'pubspec.yaml'
  ];

  for (const file of fileCandidates) {
    if (fileExists(path.join(repoRoot, file))) config.push(file);
  }

  if (inventory.ciFiles.length) config.push('CI pipeline detected');
  return uniq(config);
}

function uniqByName(items: BlueprintDependency[]): BlueprintDependency[] {
  const seen = new Map<string, BlueprintDependency>();
  for (const item of items) {
    if (!seen.has(item.name)) seen.set(item.name, item);
  }
  return [...seen.values()].sort((a, b) => a.name.localeCompare(b.name));
}

function inferDependencyPurpose(name: string): string {
  const lower = name.toLowerCase();
  if (/(react|vue|svelte|flutter)/.test(lower)) return 'UI framework';
  if (/(express|fastify|koa|nestjs|hono)/.test(lower)) return 'Server framework';
  if (/(dio|axios|fetch|http)/.test(lower)) return 'HTTP client';
  if (/(typeorm|prisma|sequelize|drift|isar|realm|mongoose)/.test(lower)) return 'Persistence/ORM';
  if (/(riverpod|getx|bloc|redux|zustand|mobx)/.test(lower)) return 'State management';
  if (/(jest|vitest|mocha|pytest|flutter_test)/.test(lower)) return 'Testing';
  if (/(firebase|supabase)/.test(lower)) return 'Backend platform';
  if (/(easy_localization|i18n|intl)/.test(lower)) return 'Localization';
  return 'General dependency';
}

function isCriticalDependency(name: string): boolean {
  return /(react|next|flutter|express|fastify|nest|dio|axios|firebase|supabase|typeorm|prisma|riverpod|getx|bloc)/i.test(name);
}
