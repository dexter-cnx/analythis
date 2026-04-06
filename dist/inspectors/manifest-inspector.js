"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.inspectDependencies = inspectDependencies;
exports.inspectConfiguration = inspectConfiguration;
const path = __importStar(require("path"));
const utils_1 = require("../utils");
function inspectDependencies(repoRoot, inventory) {
    const deps = [];
    const packageJsonPath = path.join(repoRoot, 'package.json');
    if ((0, utils_1.fileExists)(packageJsonPath)) {
        try {
            const pkg = JSON.parse((0, utils_1.readTextSafe)(packageJsonPath));
            for (const [name] of Object.entries(pkg.dependencies ?? {})) {
                deps.push({ name, purpose: inferDependencyPurpose(name), critical: isCriticalDependency(name) });
            }
        }
        catch { }
    }
    const pubspecPath = path.join(repoRoot, 'pubspec.yaml');
    if ((0, utils_1.fileExists)(pubspecPath)) {
        const content = (0, utils_1.readTextSafe)(pubspecPath);
        const lines = content.split(/\r?\n/);
        let inDependencies = false;
        for (const line of lines) {
            if (/^dependencies:\s*$/.test(line)) {
                inDependencies = true;
                continue;
            }
            if (/^[A-Za-z_]+:\s*$/.test(line) && !/^\s+/.test(line) && !/^dependencies:\s*$/.test(line)) {
                inDependencies = false;
            }
            if (inDependencies) {
                const match = line.match(/^\s{2,}([a-zA-Z0-9_\-]+):/);
                if (match) {
                    const name = match[1];
                    deps.push({ name, purpose: inferDependencyPurpose(name), critical: isCriticalDependency(name) });
                }
            }
        }
    }
    return uniqByName(deps);
}
function inspectConfiguration(repoRoot, inventory) {
    const config = [];
    const fileCandidates = [
        '.env',
        '.env.example',
        '.env.local',
        'docker-compose.yml',
        'docker-compose.yaml',
        'analysis_options.yaml',
        'tsconfig.json',
        'vite.config.ts',
        'vite.config.js',
        'next.config.js',
        'next.config.ts',
        'pubspec.yaml'
    ];
    for (const file of fileCandidates) {
        if ((0, utils_1.fileExists)(path.join(repoRoot, file)))
            config.push(file);
    }
    if (inventory.ciFiles.length)
        config.push('CI pipeline detected');
    return (0, utils_1.uniq)(config);
}
function uniqByName(items) {
    const seen = new Map();
    for (const item of items) {
        if (!seen.has(item.name))
            seen.set(item.name, item);
    }
    return [...seen.values()].sort((a, b) => a.name.localeCompare(b.name));
}
function inferDependencyPurpose(name) {
    const lower = name.toLowerCase();
    if (/(react|vue|svelte|flutter)/.test(lower))
        return 'UI framework';
    if (/(express|fastify|koa|nestjs|hono)/.test(lower))
        return 'Server framework';
    if (/(dio|axios|fetch|http)/.test(lower))
        return 'HTTP client';
    if (/(typeorm|prisma|sequelize|drift|isar|realm|mongoose)/.test(lower))
        return 'Persistence/ORM';
    if (/(riverpod|getx|bloc|redux|zustand|mobx)/.test(lower))
        return 'State management';
    if (/(jest|vitest|mocha|pytest|flutter_test)/.test(lower))
        return 'Testing';
    if (/(firebase|supabase)/.test(lower))
        return 'Backend platform';
    if (/(easy_localization|i18n|intl)/.test(lower))
        return 'Localization';
    return 'General dependency';
}
function isCriticalDependency(name) {
    return /(react|next|flutter|express|fastify|nest|dio|axios|firebase|supabase|typeorm|prisma|riverpod|getx|bloc)/i.test(name);
}
