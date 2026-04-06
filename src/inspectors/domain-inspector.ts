import * as path from 'path';
import type { BlueprintEntity, BlueprintUseCase } from '../core/types/blueprint';
import type { Inventory } from '../core/types/inventory';
import { listFilesRecursive, readTextSafe, uniq } from '../utils';

const ENTITY_PATTERNS = [
  'user', 'customer', 'client', 'order', 'invoice', 'payment', 'product', 'item',
  'cart', 'task', 'ticket', 'queue', 'role', 'permission', 'audit', 'notification',
  'employee', 'branch', 'store', 'lead', 'contact', 'shipment', 'stock', 'inventory'
];

const USE_CASE_PATTERNS = [
  'create', 'update', 'delete', 'list', 'get', 'fetch', 'sync', 'login', 'logout',
  'checkout', 'assign', 'approve', 'cancel', 'archive', 'search', 'scan', 'process'
];

export function inspectEntities(repoRoot: string, inventory: Inventory, shallow = false): BlueprintEntity[] {
  const files = listFilesRecursive(repoRoot, { shallow, maxFiles: shallow ? 200 : 1500 });
  const found: BlueprintEntity[] = [];

  for (const file of files) {
    const lower = file.toLowerCase();
    for (const pattern of ENTITY_PATTERNS) {
      if (lower.includes(pattern)) {
        found.push({
          name: pascalCase(pattern),
          description: `Likely domain entity inferred from file path ${file}.`,
          fields: inferFieldsFromContent(readTextSafe(path.join(repoRoot, file))),
          rules: inferRules(pattern)
        });
      }
    }
  }

  return dedupeEntities(found).slice(0, 20);
}

export function inspectUseCases(repoRoot: string, inventory: Inventory, shallow = false): BlueprintUseCase[] {
  const files = listFilesRecursive(repoRoot, { shallow, maxFiles: shallow ? 200 : 1500 });
  const found: BlueprintUseCase[] = [];

  for (const file of files) {
    const lower = file.toLowerCase();
    for (const pattern of USE_CASE_PATTERNS) {
      if (lower.includes(pattern)) {
        const related = ENTITY_PATTERNS.filter((p) => lower.includes(p)).map(pascalCase);
        found.push({
          name: sentenceCase(pattern),
          actors: inferActors(related),
          steps: inferSteps(pattern, related),
          relatedEntities: uniq(related)
        });
      }
    }
  }

  return dedupeUseCases(found).slice(0, 24);
}

function inferFieldsFromContent(content: string): string[] {
  const matches = content.match(/\b(id|name|title|status|email|phone|amount|price|quantity|createdAt|updatedAt|address|role)\b/g) ?? [];
  return uniq(matches).slice(0, 8);
}

function inferRules(entity: string): string[] {
  switch (entity) {
    case 'payment': return ['amount should be validated', 'payment status should be explicit'];
    case 'order': return ['order status transitions should be controlled'];
    case 'user': return ['sensitive fields should not leak to UI'];
    case 'audit': return ['business mutations should emit audit events'];
    default: return ['entity invariants should be validated'];
  }
}

function inferActors(related: string[]): string[] {
  if (related.includes('User')) return ['user'];
  if (related.includes('Customer')) return ['admin', 'sales'];
  return ['system'];
}

function inferSteps(verb: string, related: string[]): string[] {
  const noun = related[0] ?? 'resource';
  return [`validate ${noun.toLowerCase()} input`, `${verb} ${noun.toLowerCase()}`, 'persist changes if applicable'];
}

function dedupeEntities(items: BlueprintEntity[]): BlueprintEntity[] {
  const map = new Map<string, BlueprintEntity>();
  for (const item of items) {
    if (!map.has(item.name)) map.set(item.name, item);
  }
  return [...map.values()].sort((a, b) => a.name.localeCompare(b.name));
}

function dedupeUseCases(items: BlueprintUseCase[]): BlueprintUseCase[] {
  const map = new Map<string, BlueprintUseCase>();
  for (const item of items) {
    const key = `${item.name}:${item.relatedEntities.join(',')}`;
    if (!map.has(key)) map.set(key, item);
  }
  return [...map.values()].sort((a, b) => a.name.localeCompare(b.name));
}

function pascalCase(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1).toLowerCase();
}

function sentenceCase(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1).toLowerCase();
}
