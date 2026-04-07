import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import type { AnalythisRc, LLMConfig, LLMProvider } from './types';
import { DEFAULT_MODELS } from './types';

const RC_FILENAME = '.analythisrc.json';

/** Resolve ${VAR_NAME} placeholders from process.env. */
function resolveEnvPlaceholders(value: string): string {
  return value.replace(/\$\{([^}]+)\}/g, (_, varName: string) => {
    const resolved = process.env[varName];
    if (!resolved) {
      throw new Error(
        `analythis: environment variable "${varName}" referenced in .analythisrc.json is not set.`
      );
    }
    return resolved;
  });
}

function loadRcFile(filePath: string): AnalythisRc | null {
  try {
    const raw = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(raw) as AnalythisRc;
  } catch {
    return null;
  }
}

/** Read .analythisrc.json from cwd, then home dir. Returns null if not found. */
export function readRcConfig(): AnalythisRc | null {
  const candidates = [
    path.join(process.cwd(), RC_FILENAME),
    path.join(os.homedir(), RC_FILENAME)
  ];
  for (const candidate of candidates) {
    const rc = loadRcFile(candidate);
    if (rc) return rc;
  }
  return null;
}

export interface LLMCliOverrides {
  provider?: string;
  model?: string;
  apiKey?: string;
  baseUrl?: string;
}

/**
 * Build the final LLMConfig by merging (in order of priority):
 *   1. CLI flags  (highest)
 *   2. .analythisrc.json
 *   3. Built-in defaults  (lowest)
 */
export function resolveLLMConfig(overrides: LLMCliOverrides = {}): LLMConfig {
  const rc = readRcConfig();
  const rcLlm = rc?.llm ?? {};

  const provider = (overrides.provider ?? rcLlm.provider ?? 'anthropic') as LLMProvider;
  const model = overrides.model ?? rcLlm.model ?? DEFAULT_MODELS[provider];

  let apiKey: string | undefined = overrides.apiKey ?? rcLlm.apiKey;
  if (apiKey) apiKey = resolveEnvPlaceholders(apiKey);

  // If no explicit apiKey and provider needs one, fall back to well-known env vars
  if (!apiKey) {
    if (provider === 'anthropic') apiKey = process.env['ANTHROPIC_API_KEY'];
    if (provider === 'openai') apiKey = process.env['OPENAI_API_KEY'];
  }

  const baseUrl = overrides.baseUrl ?? rcLlm.baseUrl;

  return {
    provider,
    model,
    apiKey,
    baseUrl,
    maxTokens: rcLlm.maxTokens ?? 2048
  };
}
