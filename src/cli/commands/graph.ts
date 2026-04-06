import * as path from 'path';
import { resolveInput } from '../../intake/resolve-input';
import { buildImportGraph } from '../../inspectors/import-graph-inspector';
import { exportImportGraph } from '../../exporters/graph';
import { ensureDir } from '../../utils';

export async function runGraph(
  input: string,
  outputDir: string,
  branch?: string,
  shallow = false
): Promise<void> {
  const resolved = resolveInput(input, branch);
  try {
    const out = path.resolve(outputDir);
    ensureDir(out);

    const graph = buildImportGraph(resolved.workingRoot, shallow);
    exportImportGraph(graph, out);

    console.log(`analythis graph completed.`);
    console.log(`Nodes: ${graph.nodes.filter((n) => n.language !== 'external').length} source files`);
    console.log(`Edges: ${graph.edges.filter((e) => e.type === 'internal').length} internal imports, ${graph.edges.filter((e) => e.type === 'external').length} external`);
    console.log(`Output: ${out}/graph.json | graph.mmd | graph.dot`);
  } finally {
    resolved.cleanup();
  }
}
