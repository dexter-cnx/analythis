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
exports.inspectEntities = inspectEntities;
exports.inspectUseCases = inspectUseCases;
const path = __importStar(require("path"));
const utils_1 = require("../utils");
const ENTITY_PATTERNS = [
    'user', 'customer', 'client', 'order', 'invoice', 'payment', 'product', 'item',
    'cart', 'task', 'ticket', 'queue', 'role', 'permission', 'audit', 'notification',
    'employee', 'branch', 'store', 'lead', 'contact', 'shipment', 'stock', 'inventory'
];
const USE_CASE_PATTERNS = [
    'create', 'update', 'delete', 'list', 'get', 'fetch', 'sync', 'login', 'logout',
    'checkout', 'assign', 'approve', 'cancel', 'archive', 'search', 'scan', 'process'
];
function inspectEntities(repoRoot, inventory, shallow = false) {
    const files = (0, utils_1.listFilesRecursive)(repoRoot, { shallow, maxFiles: shallow ? 200 : 1500 });
    const found = [];
    for (const file of files) {
        const lower = file.toLowerCase();
        for (const pattern of ENTITY_PATTERNS) {
            if (lower.includes(pattern)) {
                found.push({
                    name: pascalCase(pattern),
                    description: `Likely domain entity inferred from file path ${file}.`,
                    fields: inferFieldsFromContent((0, utils_1.readTextSafe)(path.join(repoRoot, file))),
                    rules: inferRules(pattern)
                });
            }
        }
    }
    return dedupeEntities(found).slice(0, 20);
}
function inspectUseCases(repoRoot, inventory, shallow = false) {
    const files = (0, utils_1.listFilesRecursive)(repoRoot, { shallow, maxFiles: shallow ? 200 : 1500 });
    const found = [];
    for (const file of files) {
        const lower = file.toLowerCase();
        for (const pattern of USE_CASE_PATTERNS) {
            if (lower.includes(pattern)) {
                const related = ENTITY_PATTERNS.filter((p) => lower.includes(p)).map(pascalCase);
                found.push({
                    name: sentenceCase(pattern),
                    actors: inferActors(related),
                    steps: inferSteps(pattern, related),
                    relatedEntities: (0, utils_1.uniq)(related)
                });
            }
        }
    }
    return dedupeUseCases(found).slice(0, 24);
}
function inferFieldsFromContent(content) {
    const matches = content.match(/\b(id|name|title|status|email|phone|amount|price|quantity|createdAt|updatedAt|address|role)\b/g) ?? [];
    return (0, utils_1.uniq)(matches).slice(0, 8);
}
function inferRules(entity) {
    switch (entity) {
        case 'payment': return ['amount should be validated', 'payment status should be explicit'];
        case 'order': return ['order status transitions should be controlled'];
        case 'user': return ['sensitive fields should not leak to UI'];
        case 'audit': return ['business mutations should emit audit events'];
        default: return ['entity invariants should be validated'];
    }
}
function inferActors(related) {
    if (related.includes('User'))
        return ['user'];
    if (related.includes('Customer'))
        return ['admin', 'sales'];
    return ['system'];
}
function inferSteps(verb, related) {
    const noun = related[0] ?? 'resource';
    return [`validate ${noun.toLowerCase()} input`, `${verb} ${noun.toLowerCase()}`, 'persist changes if applicable'];
}
function dedupeEntities(items) {
    const map = new Map();
    for (const item of items) {
        if (!map.has(item.name))
            map.set(item.name, item);
    }
    return [...map.values()].sort((a, b) => a.name.localeCompare(b.name));
}
function dedupeUseCases(items) {
    const map = new Map();
    for (const item of items) {
        const key = `${item.name}:${item.relatedEntities.join(',')}`;
        if (!map.has(key))
            map.set(key, item);
    }
    return [...map.values()].sort((a, b) => a.name.localeCompare(b.name));
}
function pascalCase(value) {
    return value.charAt(0).toUpperCase() + value.slice(1).toLowerCase();
}
function sentenceCase(value) {
    return value.charAt(0).toUpperCase() + value.slice(1).toLowerCase();
}
