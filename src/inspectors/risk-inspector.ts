import type { Blueprint } from '../core/types/blueprint';
import type { Inventory } from '../core/types/inventory';

export function inspectRisks(inventory: Inventory, blueprintSoFar: Partial<Blueprint>): string[] {
  const risks: string[] = [];
  const modules = blueprintSoFar.modules ?? [];
  const architecture = blueprintSoFar.architecture;
  const deps = blueprintSoFar.dependencies ?? [];

  if (inventory.repoType === 'unknown') risks.push('Repository type could not be confidently inferred.');
  if (!inventory.testLocations.length) risks.push('No obvious test locations were detected.');
  if (!inventory.ciFiles.length) risks.push('No CI pipeline files were detected.');
  if (inventory.repoType === 'backend' && !blueprintSoFar.api_surfaces?.some((s) => s.type === 'REST' || s.type === 'GraphQL')) {
    risks.push('Backend repository detected but API surface is unclear.');
  }
  if (inventory.repoType === 'mobile' && !deps.some((d) => /intl|i18n|localization/i.test(d.name))) {
    risks.push('Mobile app detected without obvious localization tooling.');
  }
  if (architecture && architecture.style.includes('clean-architecture') && !modules.some((m) => m.name === 'features' || m.name === 'modules')) {
    risks.push('Clean architecture signals exist, but feature/module boundaries are not obvious.');
  }
  if (!blueprintSoFar.events?.length) risks.push('No eventing or job patterns were detected; async workflows may be tightly coupled.');
  return risks;
}

export function inspectRefactorOpportunities(inventory: Inventory, blueprintSoFar: Partial<Blueprint>): string[] {
  const opportunities: string[] = [];
  if (inventory.repoType === 'backend') {
    opportunities.push('Ensure route handlers stay thin and delegate business logic to services/use cases.');
  }
  if (inventory.repoType === 'web' || inventory.repoType === 'mobile') {
    opportunities.push('Keep presentation logic separate from data-fetching and DTO mapping.');
  }
  if (!inventory.testLocations.length) {
    opportunities.push('Introduce a clear test strategy for high-value modules and use cases.');
  }
  if (!blueprintSoFar.events?.includes('audit events')) {
    opportunities.push('Consider adding audit events for important business mutations.');
  }
  if (!blueprintSoFar.configuration?.length) {
    opportunities.push('Introduce explicit configuration and environment handling.');
  }
  return opportunities;
}
