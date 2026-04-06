import * as path from 'path';
import YAML from 'yaml';
import type { Blueprint } from '../core/types/blueprint';
import { writeText } from '../utils';

export function exportBlueprintYaml(blueprint: Blueprint, outputDir: string): void {
  writeText(path.join(outputDir, 'blueprint.yaml'), YAML.stringify(blueprint));
}
