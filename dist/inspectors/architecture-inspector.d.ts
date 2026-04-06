import type { Blueprint, BlueprintModule } from '../core/types/blueprint';
import type { Inventory, ProfileName } from '../core/types/inventory';
export declare function inspectArchitecture(inventory: Inventory, profile: ProfileName): Blueprint['architecture'];
export declare function inspectModules(inventory: Inventory): BlueprintModule[];
