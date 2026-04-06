"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.inspectArchitecture = inspectArchitecture;
exports.inspectModules = inspectModules;
function inspectArchitecture(inventory, profile) {
    const style = [];
    const layers = [];
    const dependency_rules = [];
    let module_strategy = 'directory-based';
    const dirs = inventory.topLevelDirs;
    if (dirs.includes('presentation') || dirs.includes('domain') || dirs.includes('data')) {
        style.push('clean-architecture');
        layers.push('presentation', 'domain', 'data');
        dependency_rules.push('presentation should depend on domain, not data');
        dependency_rules.push('data should implement domain contracts');
    }
    if (dirs.includes('features') || dirs.includes('modules')) {
        style.push('feature-first');
        module_strategy = 'feature-first';
    }
    if (inventory.repoType === 'monorepo' || profile === 'monorepo') {
        style.push('workspace-based');
        module_strategy = 'workspace packages/apps';
        dependency_rules.push('shared packages should not depend on apps');
    }
    if (inventory.repoType === 'backend') {
        style.push('service-oriented');
        layers.push(...['api', 'services', 'persistence']);
        dependency_rules.push('route handlers should remain thin');
    }
    if (inventory.repoType === 'web') {
        style.push('frontend-module-driven');
        layers.push(...['ui', 'state', 'data']);
    }
    if (inventory.repoType === 'mobile') {
        style.push('mobile-feature-modules');
        layers.push(...['screens', 'state', 'data']);
    }
    if (style.length === 0) {
        style.push('heuristic-structure');
    }
    return {
        style: unique(style),
        layers: unique(layers),
        module_strategy,
        dependency_rules: unique(dependency_rules)
    };
}
function inspectModules(inventory) {
    const candidates = ['src', 'lib', 'app', 'server', 'api', 'features', 'modules', 'packages', 'apps'];
    const modules = [];
    for (const dir of candidates) {
        if (inventory.topLevelDirs.includes(dir)) {
            modules.push({
                name: dir,
                purpose: describeModulePurpose(dir),
                paths: [dir],
                dependsOn: inferDependsOn(dir)
            });
        }
    }
    if (modules.length === 0) {
        modules.push({
            name: 'root',
            purpose: 'Repository root contains the main implementation.',
            paths: ['.'],
            dependsOn: []
        });
    }
    return modules;
}
function describeModulePurpose(name) {
    switch (name) {
        case 'src': return 'Primary source code.';
        case 'lib': return 'Core implementation or reusable package code.';
        case 'app': return 'Application shell or main app entry.';
        case 'server': return 'Backend service implementation.';
        case 'api': return 'API endpoints or contracts.';
        case 'features': return 'Feature-based modules.';
        case 'modules': return 'Logical domain or technical modules.';
        case 'packages': return 'Workspace shared packages.';
        case 'apps': return 'Workspace runnable applications.';
        default: return 'Top-level repository module.';
    }
}
function inferDependsOn(name) {
    if (name === 'app')
        return ['lib', 'src'];
    if (name === 'features')
        return ['src', 'lib'];
    if (name === 'server')
        return ['api'];
    if (name === 'apps')
        return ['packages'];
    return [];
}
function unique(values) {
    return [...new Set(values)];
}
