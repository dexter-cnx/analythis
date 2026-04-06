"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.inspectApiSurfaces = inspectApiSurfaces;
exports.inspectEvents = inspectEvents;
const utils_1 = require("../utils");
function inspectApiSurfaces(inventory) {
    const surfaces = [];
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
function inspectEvents(inventory) {
    const candidates = [];
    const joined = inventory.topLevelDirs.join(' ').toLowerCase() + ' ' + inventory.rootFiles.join(' ').toLowerCase();
    if (/queue|job|worker/.test(joined))
        candidates.push('background jobs');
    if (/event|events/.test(joined))
        candidates.push('domain/application events');
    if (/audit/.test(joined))
        candidates.push('audit events');
    return (0, utils_1.uniq)(candidates);
}
