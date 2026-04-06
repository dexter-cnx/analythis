import * as path from 'path';
import { resolveInput } from '../../intake/resolve-input';
import { inspectInventory } from '../../inspectors/inventory-inspector';
import { exportInventoryMarkdown } from '../../exporters/markdown';
import { ensureDir, writeJson } from '../../utils';

export async function runInspect(input: string, outputDir: string, branch?: string): Promise<void> {
  const resolved = resolveInput(input, branch);
  try {
    const inventory = inspectInventory(resolved.workingRoot);
    const out = path.resolve(outputDir);
    ensureDir(out);
    writeJson(path.join(out, 'inventory.json'), inventory);
    exportInventoryMarkdown(inventory, out);
    console.log(`analythis inspect completed.`);
    console.log(`Output: ${out}`);
  } finally {
    resolved.cleanup();
  }
}
