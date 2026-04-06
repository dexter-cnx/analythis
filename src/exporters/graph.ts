import * as path from 'path';
import type { ImportGraph, ImportGraphNode, ImportGraphEdge } from '../inspectors/import-graph-inspector';
import { writeJson, writeText, ensureDir } from '../utils';

export function exportImportGraph(graph: ImportGraph, outputDir: string): void {
  ensureDir(outputDir);
  exportGraphJson(graph, outputDir);
  exportGraphMermaid(graph, outputDir);
  exportGraphDot(graph, outputDir);
}

function exportGraphJson(graph: ImportGraph, outputDir: string): void {
  writeJson(path.join(outputDir, 'graph.json'), graph);
}

function sanitizeId(id: string): string {
  // Mermaid node IDs can't have special chars — use index-based IDs mapped to labels
  return id.replace(/[^a-zA-Z0-9_]/g, '_');
}

function exportGraphMermaid(graph: ImportGraph, outputDir: string): void {
  const internalNodes = graph.nodes.filter((n) => n.language !== 'external');
  const internalEdges = graph.edges.filter((e) => e.type === 'internal');

  // Build id → sanitized Mermaid ID map
  const idMap = new Map<string, string>();
  for (const node of internalNodes) {
    idMap.set(node.id, `N${idMap.size}`);
  }

  const lines: string[] = ['graph LR'];

  // Node definitions with labels (truncated paths for readability)
  for (const node of internalNodes) {
    const mid = idMap.get(node.id)!;
    const label = shortLabel(node.id);
    lines.push(`  ${mid}["${label}"]`);
  }

  // Edges
  for (const edge of internalEdges) {
    const fromId = idMap.get(edge.from);
    const toId = idMap.get(edge.to);
    if (fromId && toId) {
      lines.push(`  ${fromId} --> ${toId}`);
    }
  }

  // External deps as a summary note
  const externalEdges = graph.edges.filter((e) => e.type === 'external');
  if (externalEdges.length > 0) {
    const externalPackages = [...new Set(externalEdges.map((e) => topLevelPackage(e.to)))].slice(0, 20);
    lines.push('');
    lines.push('  subgraph External');
    for (const pkg of externalPackages) {
      const eid = `EXT_${sanitizeId(pkg)}`;
      lines.push(`    ${eid}["📦 ${pkg}"]`);
    }
    lines.push('  end');
    // Connect internal files to external
    const seen = new Set<string>();
    for (const edge of externalEdges) {
      const fromId = idMap.get(edge.from);
      const pkg = topLevelPackage(edge.to);
      const eid = `EXT_${sanitizeId(pkg)}`;
      const key = `${fromId}→${eid}`;
      if (fromId && !seen.has(key)) {
        seen.add(key);
        lines.push(`  ${fromId} -.-> ${eid}`);
      }
    }
  }

  writeText(path.join(outputDir, 'graph.mmd'), lines.join('\n') + '\n');
}

function exportGraphDot(graph: ImportGraph, outputDir: string): void {
  const lines: string[] = ['digraph imports {', '  rankdir=LR;', '  node [shape=box fontname="Helvetica" fontsize=10];', ''];

  // Internal nodes
  const internalNodes = graph.nodes.filter((n) => n.language !== 'external');
  for (const node of internalNodes) {
    const label = shortLabel(node.id);
    const color = languageColor(node.language);
    lines.push(`  "${node.id}" [label="${label}" style=filled fillcolor="${color}"];`);
  }

  // External packages as clusters would be too complex; use a simple node per package
  const externalPackages = [...new Set(
    graph.edges.filter((e) => e.type === 'external').map((e) => topLevelPackage(e.to))
  )].slice(0, 30);

  if (externalPackages.length > 0) {
    lines.push('');
    lines.push('  // External dependencies');
    for (const pkg of externalPackages) {
      lines.push(`  "${pkg}" [label="${pkg}" shape=ellipse style=filled fillcolor="#eeeeee"];`);
    }
  }

  // Internal edges
  lines.push('');
  lines.push('  // Internal imports');
  for (const edge of graph.edges.filter((e) => e.type === 'internal')) {
    lines.push(`  "${edge.from}" -> "${edge.to}";`);
  }

  // External edges (deduplicated to package level)
  if (externalPackages.length > 0) {
    lines.push('');
    lines.push('  // External imports');
    const seen = new Set<string>();
    for (const edge of graph.edges.filter((e) => e.type === 'external')) {
      const pkg = topLevelPackage(edge.to);
      const key = `${edge.from}→${pkg}`;
      if (!seen.has(key)) {
        seen.add(key);
        lines.push(`  "${edge.from}" -> "${pkg}" [style=dashed];`);
      }
    }
  }

  lines.push('}');
  writeText(path.join(outputDir, 'graph.dot'), lines.join('\n') + '\n');
}

function shortLabel(id: string): string {
  const parts = id.split('/');
  if (parts.length <= 2) return id;
  return '…/' + parts.slice(-2).join('/');
}

function topLevelPackage(importPath: string): string {
  // For scoped packages like @org/pkg, keep two parts; otherwise keep first
  if (importPath.startsWith('@')) {
    return importPath.split('/').slice(0, 2).join('/');
  }
  return importPath.split('/')[0];
}

function languageColor(language: string): string {
  switch (language) {
    case 'TypeScript': return '#3178c6';
    case 'JavaScript': return '#f7df1e';
    case 'Python': return '#3776ab';
    case 'Dart': return '#0175c2';
    default: return '#cccccc';
  }
}
