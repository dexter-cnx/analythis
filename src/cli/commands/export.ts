import * as path from 'path';
import type { ExportOptions } from '../../core/types/options';
import type { Blueprint } from '../../core/types/blueprint';
import { exportBlueprintMarkdown } from '../../exporters/markdown';
import { exportBlueprintYaml } from '../../exporters/yaml';
import { ensureDir, readJson } from '../../utils';

export async function runExport(inputFile: string, options: ExportOptions): Promise<void> {
  const blueprint = readJson<Blueprint>(path.resolve(inputFile));
  const outputDir = path.resolve(options.outputDir);
  ensureDir(outputDir);

  if (options.to === 'md') {
    exportBlueprintMarkdown(blueprint, outputDir);
  } else {
    exportBlueprintYaml(blueprint, outputDir);
  }

  console.log(`analythis export completed.`);
  console.log(`Output: ${outputDir}`);
}
