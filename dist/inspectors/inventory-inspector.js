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
exports.inspectInventory = inspectInventory;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const utils_1 = require("../utils");
function inspectInventory(repoRoot, shallow = false) {
    const files = (0, utils_1.listFilesRecursive)(repoRoot, { shallow });
    const rootEntries = fs.readdirSync(repoRoot, { withFileTypes: true });
    const rootFiles = rootEntries.filter((e) => e.isFile()).map((e) => e.name).sort();
    const topLevelDirs = rootEntries.filter((e) => e.isDirectory()).map((e) => e.name).sort();
    const manifests = files.filter((f) => /(^|\/)(package\.json|pubspec\.yaml|Cargo\.toml|pom\.xml|build\.gradle|go\.mod|requirements\.txt|pyproject\.toml|melos\.yaml)$/i.test(f));
    const entryPoints = files.filter((f) => /(^|\/)(main\.(dart|ts|tsx|js|jsx|py|go)|app\.(ts|tsx|js|jsx)|server\.(ts|js)|index\.(ts|tsx|js|jsx))$/i.test(f));
    const testLocations = (0, utils_1.uniq)(files.filter((f) => /(^|\/)(test|tests|__tests__|spec)(\/|$)|\.(test|spec)\./i.test(f)).map((f) => f.split('/')[0]));
    const ciFiles = files.filter((f) => /(^|\/)(\.github\/workflows\/|gitlab-ci|azure-pipelines|Jenkinsfile|circleci)/i.test(f));
    const infraFiles = files.filter((f) => /Dockerfile|docker-compose|terraform|helm|k8s|kubectl|ansible/i.test(f));
    const notableFiles = files.filter((f) => /README|LICENSE|AGENTS\.md|CLAUDE\.md|analysis_options\.yaml|tsconfig\.json|next\.config|vite\.config|tailwind\.config/i.test(f));
    const languages = (0, utils_1.uniq)(files.map(utils_1.detectLanguageFromExtension).filter((v) => Boolean(v)));
    const packageManagers = (0, utils_1.uniq)([
        manifests.some((m) => m.endsWith('package.json')) ? 'npm' : '',
        manifests.some((m) => m.endsWith('pubspec.yaml')) ? 'pub' : '',
        manifests.some((m) => m.endsWith('go.mod')) ? 'go' : '',
        manifests.some((m) => m.endsWith('Cargo.toml')) ? 'cargo' : '',
        manifests.some((m) => m.endsWith('requirements.txt') || m.endsWith('pyproject.toml')) ? 'pip' : ''
    ]);
    const frameworkHints = detectFrameworkHints(files);
    const repoType = inferRepoType(files, frameworkHints, topLevelDirs, languages);
    return {
        repoName: path.basename(repoRoot),
        repoRoot,
        repoType,
        rootFiles,
        topLevelDirs,
        languages,
        manifests,
        entryPoints,
        testLocations,
        ciFiles,
        infraFiles,
        notableFiles,
        packageManagers,
        frameworkHints
    };
}
function detectFrameworkHints(files) {
    const hints = [];
    if (files.includes('pubspec.yaml'))
        hints.push('Flutter/Dart');
    if (files.includes('next.config.js') || files.includes('next.config.ts'))
        hints.push('Next.js');
    if (files.some((f) => /express|nest|koa/i.test(f)))
        hints.push('Node backend');
    if (files.includes('go.mod'))
        hints.push('Go');
    if (files.includes('Cargo.toml'))
        hints.push('Rust');
    if (files.includes('requirements.txt') || files.includes('pyproject.toml'))
        hints.push('Python');
    if (files.includes('pom.xml') || files.includes('build.gradle'))
        hints.push('JVM');
    if (files.includes('melos.yaml'))
        hints.push('Monorepo workspace');
    return (0, utils_1.uniq)(hints);
}
function inferRepoType(files, frameworkHints, topLevelDirs, languages) {
    const hasFlutter = files.includes('pubspec.yaml') && languages.includes('Dart');
    const hasMobileDirs = topLevelDirs.includes('android') || topLevelDirs.includes('ios');
    const hasBackend = files.some((f) => /server|api|controllers|routes|handlers|migrations/i.test(f));
    const hasWeb = files.some((f) => /next\.config|vite\.config|src\/pages|src\/app|public\//i.test(f));
    const hasWorkspace = files.includes('melos.yaml') || topLevelDirs.includes('packages') || topLevelDirs.includes('apps');
    if (hasWorkspace)
        return 'monorepo';
    if (hasFlutter && hasBackend)
        return 'fullstack';
    if (hasFlutter || hasMobileDirs)
        return 'mobile';
    if (hasBackend && !hasWeb)
        return 'backend';
    if (hasWeb && !hasBackend)
        return 'web';
    if (topLevelDirs.includes('src') && topLevelDirs.includes('examples') && !hasBackend && !hasWeb)
        return 'library';
    if (frameworkHints.includes('Monorepo workspace'))
        return 'monorepo';
    return 'unknown';
}
