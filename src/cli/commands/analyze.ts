import * as path from 'path';
import { analyzeRepository } from '../../core/engine/analyzer';
import type { AnalyzeOptions } from '../../core/types/options';
import { resolveInput } from '../../intake/resolve-input';
import { exportBlueprintMarkdown, exportInventoryMarkdown, exportPromptPackMarkdown } from '../../exporters/markdown';
import { buildImportGraph } from '../../inspectors/import-graph-inspector';
import { exportImportGraph } from '../../exporters/graph';
import { synthesize } from '../../llm/synthesizer';
import { resolveLLMConfig, validateLLMConfig } from '../../llm/config';
import { exportLLMResults } from '../../exporters/llm';
import { writeJson, ensureDir } from '../../utils';

export async function runAnalyze(input: string, options: AnalyzeOptions): Promise<void> {
  // Validate LLM config before cloning/scanning — fail fast with a clear message.
  if (options.llm && options.llm.tasks.length > 0) {
    const llmConfig = resolveLLMConfig({
      provider: options.llm.provider,
      model: options.llm.model
    });
    validateLLMConfig(llmConfig);
  }

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

    if (options.llm && options.llm.tasks.length > 0) {
      const llmConfig = resolveLLMConfig({ provider: options.llm.provider, model: options.llm.model });
      console.log(`Running LLM synthesis (${llmConfig.provider} / ${llmConfig.model}) for: ${options.llm.tasks.join(', ')}...`);
      const llmResults = await synthesize({
        tasks: options.llm.tasks,
        config: llmConfig,
        blueprint: result.blueprint
      });
      exportLLMResults(llmResults, outputDir);
      console.log(`LLM output: ${outputDir}/llm/`);
    }

    console.log(`analythis analyze completed.`);
    console.log(`Output: ${outputDir}`);
  } finally {
    resolved.cleanup();
  }
}
