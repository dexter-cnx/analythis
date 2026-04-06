import type { BlueprintEntity, BlueprintUseCase } from '../core/types/blueprint';
import type { Inventory } from '../core/types/inventory';
export declare function inspectEntities(repoRoot: string, inventory: Inventory, shallow?: boolean): BlueprintEntity[];
export declare function inspectUseCases(repoRoot: string, inventory: Inventory, shallow?: boolean): BlueprintUseCase[];
