import * as path from 'path';
import { resolveInput } from '../../intake/resolve-input';
import { runComparison } from '../../core/engine/comparator';
import { exportComparisonJson, exportComparisonMarkdown } from '../../exporters/comparison';
import { ensureDir } from '../../utils';
import type { CompareOptions } from '../../core/types/options';

export async function runCompare(inputs: string[], options: CompareOptions): Promise<void> {
  const resolved = inputs.map((input) => resolveInput(input, options.branch));

  try {
    const outputDir = path.resolve(options.outputDir);
    ensureDir(outputDir);

    const workingRoots = resolved.map((r, i) => ({
      name: path.basename(r.workingRoot) || `repo-${i + 1}`,
      root: r.workingRoot
    }));

    console.log(`Comparing ${workingRoots.length} repositories: ${workingRoots.map((w) => w.name).join(', ')}`);

    const report = await runComparison(workingRoots, {
      profile: 'generic',
      focusAreas: [],
      format: options.format,
      branch: options.branch,
      shallow: options.shallow
    });

    if (options.format === 'json' || options.format === 'both') {
      exportComparisonJson(report, outputDir);
    }
    if (options.format === 'md' || options.format === 'both') {
      exportComparisonMarkdown(report, outputDir);
    }

    console.log(`analythis compare completed.`);
    console.log(`Profile mismatch: ${report.divergence.profileMismatch}`);
    console.log(`Architecture mismatch: ${report.divergence.architectureMismatch}`);
    console.log(`Output: ${outputDir}`);
  } finally {
    for (const r of resolved) r.cleanup();
  }
}
