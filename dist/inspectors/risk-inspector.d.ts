import type { Blueprint } from '../core/types/blueprint';
import type { Inventory } from '../core/types/inventory';
export declare function inspectRisks(inventory: Inventory, blueprintSoFar: Partial<Blueprint>): string[];
export declare function inspectRefactorOpportunities(inventory: Inventory, blueprintSoFar: Partial<Blueprint>): string[];
