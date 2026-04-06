import type { AnalyzeOptions } from '../types/options';
import type { Blueprint, PromptPack } from '../types/blueprint';
import type { Inventory } from '../types/inventory';
export declare function analyzeRepository(repoRoot: string, options: AnalyzeOptions): {
    inventory: Inventory;
    blueprint: Blueprint;
    promptPack: PromptPack;
};
