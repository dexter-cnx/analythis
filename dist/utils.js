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
exports.FILE_LIMITS = void 0;
exports.ensureDir = ensureDir;
exports.writeJson = writeJson;
exports.writeText = writeText;
exports.readJson = readJson;
exports.listFilesRecursive = listFilesRecursive;
exports.detectLanguageFromExtension = detectLanguageFromExtension;
exports.uniq = uniq;
exports.readTextSafe = readTextSafe;
exports.fileExists = fileExists;
exports.run = run;
exports.sanitizeName = sanitizeName;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const child_process_1 = require("child_process");
function ensureDir(dir) {
    fs.mkdirSync(dir, { recursive: true });
}
function writeJson(filePath, data) {
    ensureDir(path.dirname(filePath));
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
}
function writeText(filePath, content) {
    ensureDir(path.dirname(filePath));
    fs.writeFileSync(filePath, content, 'utf8');
}
function readJson(filePath) {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}
/** Shared file-count limits used across all inspectors. */
exports.FILE_LIMITS = {
    /** Shallow / fast pass. */
    shallow: 300,
    /** Standard inspector depth. */
    standard: 1000,
    /** Import-graph scan. */
    graph: 500,
    /** Full deep scan (default when not shallow). */
    deep: 3000,
};
function listFilesRecursive(root, options) {
    const maxFiles = options?.maxFiles ?? (options?.shallow ? exports.FILE_LIMITS.shallow : exports.FILE_LIMITS.deep);
    const results = [];
    const ignoredDirs = new Set(['.git', 'node_modules', 'dist', 'build', '.next', '.dart_tool', 'coverage', '.turbo', '.idea', '.vscode']);
    function walk(current) {
        if (results.length >= maxFiles)
            return;
        for (const entry of fs.readdirSync(current, { withFileTypes: true })) {
            if (results.length >= maxFiles)
                return;
            const full = path.join(current, entry.name);
            const rel = path.relative(root, full) || entry.name;
            if (entry.isDirectory()) {
                if (!ignoredDirs.has(entry.name))
                    walk(full);
            }
            else {
                results.push(rel);
            }
        }
    }
    walk(root);
    if (results.length >= maxFiles && options?.onTruncated) {
        options.onTruncated(maxFiles);
    }
    return results.sort();
}
function detectLanguageFromExtension(file) {
    const ext = path.extname(file).toLowerCase();
    const map = {
        '.ts': 'TypeScript',
        '.tsx': 'TypeScript',
        '.js': 'JavaScript',
        '.jsx': 'JavaScript',
        '.dart': 'Dart',
        '.py': 'Python',
        '.go': 'Go',
        '.rs': 'Rust',
        '.java': 'Java',
        '.kt': 'Kotlin',
        '.swift': 'Swift',
        '.php': 'PHP',
        '.rb': 'Ruby',
        '.cs': 'C#',
        '.cpp': 'C++',
        '.c': 'C',
        '.h': 'C/C++ Header',
        '.html': 'HTML',
        '.css': 'CSS',
        '.scss': 'SCSS',
        '.sql': 'SQL',
        '.sh': 'Shell',
        '.yaml': 'YAML',
        '.yml': 'YAML',
        '.json': 'JSON',
        '.md': 'Markdown'
    };
    return map[ext] ?? null;
}
function uniq(values) {
    return [...new Set(values.filter(Boolean))].sort();
}
function readTextSafe(filePath) {
    try {
        return fs.readFileSync(filePath, 'utf8');
    }
    catch {
        return '';
    }
}
function fileExists(filePath) {
    return fs.existsSync(filePath);
}
function run(command, cwd) {
    return (0, child_process_1.execSync)(command, { cwd, stdio: ['ignore', 'pipe', 'pipe'] }).toString('utf8').trim();
}
function sanitizeName(input) {
    return input.replace(/[^a-zA-Z0-9._-]/g, '-');
}
