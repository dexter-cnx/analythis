import type { Blueprint, PromptPack } from '../core/types/blueprint';
import type { Inventory } from '../core/types/inventory';
export declare function exportInventoryMarkdown(inventory: Inventory, outputDir: string): void;
export declare function exportBlueprintMarkdown(blueprint: Blueprint, outputDir: string): void;
export declare function exportPromptPackMarkdown(promptPack: PromptPack, outputDir: string): void;
