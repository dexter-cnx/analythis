import type { BlueprintDependency } from '../core/types/blueprint';
import type { Inventory } from '../core/types/inventory';
export declare function inspectDependencies(repoRoot: string, inventory: Inventory): BlueprintDependency[];
export declare function inspectConfiguration(repoRoot: string, inventory: Inventory): string[];
