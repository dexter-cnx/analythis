import type { ApiSurface } from '../core/types/blueprint';
import type { Inventory } from '../core/types/inventory';
import { uniq } from '../utils';

export function inspectApiSurfaces(inventory: Inventory): ApiSurface[] {
  const surfaces: ApiSurface[] = [];
  const files = [...inventory.notableFiles, ...inventory.manifests, ...inventory.entryPoints, ...inventory.topLevelDirs];
  const joined = files.join(' ').toLowerCase();

  if (/graphql/.test(joined)) {
    surfaces.push({ type: 'GraphQL', name: 'GraphQL API', details: 'GraphQL-related files or dependencies were detected.' });
  }
  if (/routes|controllers|api/.test(joined) || inventory.repoType === 'backend') {
    surfaces.push({ type: 'REST', name: 'HTTP API', details: 'Route/controller or backend-oriented structure was detected.' });
  }
  if (/firebase|supabase/.test(joined)) {
    surfaces.push({ type: 'BaaS', name: 'Firebase/Supabase', details: 'Backend platform integration appears to be present.' });
  }
  if (/socket|websocket/.test(joined)) {
    surfaces.push({ type: 'Realtime', name: 'Socket interface', details: 'Realtime transport patterns appear in the repository.' });
  }

  if (surfaces.length === 0) {
    surfaces.push({ type: 'Unknown', name: 'No obvious external interface', details: 'No clear API surface was inferred from the repository structure.' });
  }
  return surfaces;
}

export function inspectEvents(inventory: Inventory): string[] {
  const candidates: string[] = [];
  const joined = inventory.topLevelDirs.join(' ').toLowerCase() + ' ' + inventory.rootFiles.join(' ').toLowerCase();
  if (/queue|job|worker/.test(joined)) candidates.push('background jobs');
  if (/event|events/.test(joined)) candidates.push('domain/application events');
  if (/audit/.test(joined)) candidates.push('audit events');
  return uniq(candidates);
}
