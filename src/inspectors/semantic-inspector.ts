import * as path from 'path';
import { listFilesRecursive, readTextSafe, FILE_LIMITS } from '../utils';
import type { BlueprintModule } from '../core/types/blueprint';

/**
 * Default keyword → responsibility label mappings.
 * Exported so callers can read, extend, or replace the list.
 */
export const DOMAIN_KEYWORDS: [RegExp, string][] = [
  [/\bauth|login|signin|logout|jwt|token|session|password|credential/i, 'Authentication'],
  [/\buser|account|profile|member/i, 'User management'],
  [/\bpayment|billing|invoice|subscription|stripe|charge/i, 'Billing & payments'],
  [/\bnotif|email|sms|push|alert|message/i, 'Notifications'],
  [/\bqueue|job|worker|task|schedule|cron|bull|agenda/i, 'Background jobs'],
  [/\breport|analytics|metric|dashboard|stat/i, 'Reporting & analytics'],
  [/\bconfig|setting|env|option|feature.flag/i, 'Configuration'],
  [/\baudit|log|track|event|history/i, 'Audit & event tracking'],
  [/\bpermission|role|rbac|policy|access|acl/i, 'Authorization & RBAC'],
  [/\bproduct|catalog|inventory|sku|item/i, 'Product catalog'],
  [/\border|cart|checkout|basket/i, 'Orders & checkout'],
  [/\btest|spec|mock|stub|fixture/i, 'Testing utilities'],
  [/\bdb|database|repository|dao|entity|migration|schema/i, 'Data access'],
  [/\bapi|route|controller|handler|endpoint|middleware/i, 'API layer'],
  [/\bcomponent|widget|screen|page|view|ui/i, 'UI components'],
  [/\bservice|usecase|interactor|application/i, 'Application services']
];

// Language-specific export patterns for TS/JS
const TS_EXPORT_RE = /export\s+(?:async\s+)?(?:function|class|interface|type|enum|const|abstract\s+class)\s+([A-Za-z_$][A-Za-z0-9_$]*)/g;
// Python exports (functions and classes at module level)
const PY_EXPORT_RE = /^(?:def|class)\s+([A-Za-z_][A-Za-z0-9_]*)/gm;
// Dart exports
const DART_EXPORT_RE = /^(?:class|enum|mixin|extension|typedef)\s+([A-Za-z_][A-Za-z0-9_]*)/gm;

function extractExports(content: string, language: string): string[] {
  const names = new Set<string>();
  let re: RegExp;
  let m: RegExpExecArray | null;

  if (language === 'TypeScript' || language === 'JavaScript') {
    re = new RegExp(TS_EXPORT_RE.source, 'g');
    while ((m = re.exec(content)) !== null) {
      if (!m[1].startsWith('_')) names.add(m[1]);
    }
  } else if (language === 'Python') {
    re = new RegExp(PY_EXPORT_RE.source, 'gm');
    while ((m = re.exec(content)) !== null) {
      if (!m[1].startsWith('_')) names.add(m[1]);
    }
  } else if (language === 'Dart') {
    re = new RegExp(DART_EXPORT_RE.source, 'gm');
    while ((m = re.exec(content)) !== null) {
      names.add(m[1]);
    }
  }

  return [...names].slice(0, 30);
}

function detectLanguage(file: string): string | null {
  const ext = path.extname(file).toLowerCase();
  if (ext === '.ts' || ext === '.tsx') return 'TypeScript';
  if (ext === '.js' || ext === '.jsx') return 'JavaScript';
  if (ext === '.py') return 'Python';
  if (ext === '.dart') return 'Dart';
  return null;
}

function inferResponsibilities(
  exports: string[],
  fileNames: string[],
  dirPath: string,
  extraKeywords: [RegExp, string][] = []
): string[] {
  const corpus = [dirPath, ...fileNames, ...exports].join(' ');
  const found = new Set<string>();
  for (const [re, label] of [...DOMAIN_KEYWORDS, ...extraKeywords]) {
    if (re.test(corpus)) found.add(label);
  }
  return [...found];
}

function buildModuleSummary(exports: string[], responsibilities: string[], dirPath: string): string {
  if (responsibilities.length === 0 && exports.length === 0) {
    return `Module at ${dirPath}.`;
  }
  const respPart = responsibilities.length > 0 ? `Handles ${responsibilities.slice(0, 3).join(', ')}.` : '';
  const expPart = exports.length > 0 ? ` Exports ${exports.slice(0, 5).join(', ')}${exports.length > 5 ? ` and ${exports.length - 5} more` : ''}.` : '';
  return `${respPart}${expPart}`.trim();
}

/**
 * Enrich modules with semantic information.
 *
 * @param modules        Modules to enrich.
 * @param repoRoot       Repository root directory.
 * @param shallow        Limit file scan depth.
 * @param extraKeywords  Additional [pattern, label] pairs to extend domain detection.
 *                       Useful for project-specific terminology not in the default list.
 */
export function enrichModulesWithSemantics(
  modules: BlueprintModule[],
  repoRoot: string,
  shallow = false,
  extraKeywords: [RegExp, string][] = []
): BlueprintModule[] {
  const allFiles = listFilesRecursive(repoRoot, {
    shallow,
    maxFiles: FILE_LIMITS.standard,
    onTruncated: (limit) => {
      console.warn(`analythis: semantic scan limited to ${limit} files. Some modules may have incomplete responsibility detection.`);
    }
  });

  return modules.map((mod) => {
    const modulePath = mod.paths[0] ?? mod.name;
    // Gather source files under this module's path
    const moduleFiles = allFiles.filter((f) => {
      const normalized = f.replace(/\\/g, '/');
      return normalized.startsWith(modulePath + '/') || normalized === modulePath;
    });

    const allExports: string[] = [];
    const fileBaseNames: string[] = [];

    for (const file of moduleFiles) {
      const lang = detectLanguage(file);
      if (!lang) continue;
      fileBaseNames.push(path.basename(file, path.extname(file)));
      const content = readTextSafe(path.join(repoRoot, file));
      allExports.push(...extractExports(content, lang));
    }

    const uniqueExports = [...new Set(allExports)].slice(0, 40);
    const responsibilities = inferResponsibilities(uniqueExports, fileBaseNames, modulePath, extraKeywords);
    const summary = buildModuleSummary(uniqueExports, responsibilities, modulePath);

    return {
      ...mod,
      summary,
      exports: uniqueExports,
      responsibilities
    };
  });
}
