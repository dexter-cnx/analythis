import type { LLMPlugin, LLMProvider } from './types';
import { anthropicPlugin } from './plugins/anthropic';
import { openaiPlugin } from './plugins/openai';
import { ollamaPlugin } from './plugins/ollama';

const builtinPlugins: LLMPlugin[] = [anthropicPlugin, openaiPlugin, ollamaPlugin];
const pluginMap = new Map<LLMProvider, LLMPlugin>(
  builtinPlugins.map((p) => [p.name, p])
);

/** Register a custom LLM plugin, overriding a built-in if same name is used. */
export function registerLLMPlugin(plugin: LLMPlugin): void {
  pluginMap.set(plugin.name, plugin);
}

/** Retrieve a plugin by provider name. Throws if not found. */
export function getLLMPlugin(provider: LLMProvider): LLMPlugin {
  const plugin = pluginMap.get(provider);
  if (!plugin) {
    const available = [...pluginMap.keys()].join(', ');
    throw new Error(
      `analythis: unknown LLM provider "${provider}". Available: ${available}`
    );
  }
  return plugin;
}
