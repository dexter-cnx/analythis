import * as path from 'path';
import { listFilesRecursive, readTextSafe } from '../utils';

export interface ImportGraphNode {
  id: string;
  file: string;
  language: string;
}

export interface ImportGraphEdge {
  from: string;
  to: string;
  type: 'internal' | 'external';
}

export interface ImportGraph {
  nodes: ImportGraphNode[];
  edges: ImportGraphEdge[];
  repoRoot: string;
  generatedAt: string;
}

const MAX_FILES = 500;
const SOURCE_EXTENSIONS = new Set(['.ts', '.tsx', '.js', '.jsx', '.py', '.dart']);

function detectLanguage(file: string): string | null {
  const ext = path.extname(file).toLowerCase();
  if (ext === '.ts' || ext === '.tsx') return 'TypeScript';
  if (ext === '.js' || ext === '.jsx') return 'JavaScript';
  if (ext === '.py') return 'Python';
  if (ext === '.dart') return 'Dart';
  return null;
}

function resolveImportTarget(
  fromFile: string,
  rawImport: string,
  repoRoot: string
): { resolved: string; type: 'internal' | 'external' } {
  // Relative import — internal
  if (rawImport.startsWith('.')) {
    const dir = path.dirname(path.join(repoRoot, fromFile));
    let resolved = path.relative(repoRoot, path.resolve(dir, rawImport));
    // Normalize separators
    resolved = resolved.replace(/\\/g, '/');
    // If no extension, try common source extensions
    if (!path.extname(resolved)) {
      for (const ext of ['.ts', '.tsx', '.js', '.jsx', '.py', '.dart']) {
        const candidate = resolved + ext;
        // We just record the resolved path — existence checking is too expensive here
        if (ext === '.ts' || ext === '.tsx') {
          resolved = candidate;
          break;
        }
      }
    }
    return { resolved, type: 'internal' };
  }
  // Dart package: relative to lib/
  if (rawImport.startsWith('package:')) {
    const packagePath = rawImport.replace(/^package:[^/]+\//, 'lib/');
    return { resolved: packagePath, type: 'internal' };
  }
  // Otherwise external (npm package, Python stdlib, etc.)
  return { resolved: rawImport, type: 'external' };
}

function parseImports(content: string, language: string): string[] {
  const imports: string[] = [];

  if (language === 'TypeScript' || language === 'JavaScript') {
    // Static imports: import ... from '...'
    const staticRe = /\bfrom\s+['"]([^'"]+)['"]/g;
    let m: RegExpExecArray | null;
    while ((m = staticRe.exec(content)) !== null) imports.push(m[1]);
    // Dynamic imports: import('...')
    const dynamicRe = /\bimport\s*\(\s*['"]([^'"]+)['"]\s*\)/g;
    while ((m = dynamicRe.exec(content)) !== null) imports.push(m[1]);
    // require('...')
    const requireRe = /\brequire\s*\(\s*['"]([^'"]+)['"]\s*\)/g;
    while ((m = requireRe.exec(content)) !== null) imports.push(m[1]);
    // export ... from '...'
    const reexportRe = /\bexport\s+(?:type\s+)?\{[^}]*\}\s+from\s+['"]([^'"]+)['"]/g;
    while ((m = reexportRe.exec(content)) !== null) imports.push(m[1]);
  } else if (language === 'Python') {
    // import module or from module import ...
    const importRe = /^import\s+([\w.]+)/gm;
    const fromRe = /^from\s+([\w.]+)\s+import/gm;
    let m: RegExpExecArray | null;
    while ((m = importRe.exec(content)) !== null) imports.push(m[1].replace(/\./g, '/'));
    while ((m = fromRe.exec(content)) !== null) {
      const raw = m[1];
      // Relative: starts with dots
      if (raw.startsWith('.')) {
        imports.push(raw);
      } else {
        imports.push(raw.replace(/\./g, '/'));
      }
    }
  } else if (language === 'Dart') {
    // import 'path' or import "path"
    const dartRe = /\bimport\s+['"]([^'"]+)['"]/g;
    let m: RegExpExecArray | null;
    while ((m = dartRe.exec(content)) !== null) imports.push(m[1]);
  }

  return [...new Set(imports)];
}

export function buildImportGraph(repoRoot: string, shallow = false): ImportGraph {
  const allFiles = listFilesRecursive(repoRoot, { shallow, maxFiles: MAX_FILES });
  const sourceFiles = allFiles.filter((f) => SOURCE_EXTENSIONS.has(path.extname(f).toLowerCase()));

  const nodeMap = new Map<string, ImportGraphNode>();
  const edges: ImportGraphEdge[] = [];
  const edgeSet = new Set<string>();

  for (const file of sourceFiles) {
    const lang = detectLanguage(file);
    if (!lang) continue;
    const id = file.replace(/\\/g, '/');
    if (!nodeMap.has(id)) {
      nodeMap.set(id, { id, file: id, language: lang });
    }
  }

  for (const file of sourceFiles) {
    const lang = detectLanguage(file);
    if (!lang) continue;
    const fromId = file.replace(/\\/g, '/');
    const content = readTextSafe(path.join(repoRoot, file));
    const rawImports = parseImports(content, lang);

    for (const raw of rawImports) {
      const { resolved, type } = resolveImportTarget(fromId, raw, repoRoot);
      const toId = resolved.replace(/\\/g, '/');
      const edgeKey = `${fromId}→${toId}`;
      if (edgeSet.has(edgeKey)) continue;
      edgeSet.add(edgeKey);

      // Ensure external node exists (as a placeholder)
      if (type === 'external' && !nodeMap.has(toId)) {
        nodeMap.set(toId, { id: toId, file: toId, language: 'external' });
      }

      edges.push({ from: fromId, to: toId, type });
    }
  }

  return {
    nodes: [...nodeMap.values()],
    edges,
    repoRoot,
    generatedAt: new Date().toISOString()
  };
}
