import * as path from 'path';
import { analyzeRepository } from '../../core/engine/analyzer';
import type { AnalyzeOptions } from '../../core/types/options';
import { resolveInput } from '../../intake/resolve-input';
import { exportBlueprintMarkdown, exportInventoryMarkdown, exportPromptPackMarkdown } from '../../exporters/markdown';
import { buildImportGraph } from '../../inspectors/import-graph-inspector';
import { exportImportGraph } from '../../exporters/graph';
import { writeJson, ensureDir } from '../../utils';

export async function runAnalyze(input: string, options: AnalyzeOptions): Promise<void> {
  const resolved = resolveInput(input, options.branch);
  try {
    const outputDir = path.resolve(options.outputDir);
    ensureDir(outputDir);
    const result = analyzeRepository(resolved.workingRoot, options);

    writeJson(path.join(outputDir, 'inventory.json'), result.inventory);
    writeJson(path.join(outputDir, 'blueprint.json'), result.blueprint);
    writeJson(path.join(outputDir, 'prompt-pack.json'), result.promptPack);
    exportInventoryMarkdown(result.inventory, outputDir);

    if (options.format === 'md' || options.format === 'both') {
      exportBlueprintMarkdown(result.blueprint, outputDir);
      exportPromptPackMarkdown(result.promptPack, outputDir);
    }

    if (options.graph) {
      const graph = buildImportGraph(resolved.workingRoot, options.shallow);
      exportImportGraph(graph, outputDir);
      console.log(`Import graph: ${graph.nodes.filter((n) => n.language !== 'external').length} files, ${graph.edges.filter((e) => e.type === 'internal').length} internal edges`);
    }

    console.log(`analythis analyze completed.`);
    console.log(`Output: ${outputDir}`);
  } finally {
    resolved.cleanup();
  }
}
