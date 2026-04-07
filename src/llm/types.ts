import type { Blueprint } from '../core/types/blueprint';

export type LLMProvider = 'anthropic' | 'openai' | 'ollama';

export type SynthesisTask = 'summarize' | 'risks' | 'refactor' | 'onboard';

export interface LLMConfig {
  provider: LLMProvider;
  model: string;
  apiKey?: string;
  /** Base URL override — used by Ollama (default: http://localhost:11434) and custom OpenAI-compatible endpoints. */
  baseUrl?: string;
  /** Max tokens for the completion. Default: 2048. */
  maxTokens?: number;
}

export interface LLMPlugin {
  readonly name: LLMProvider;
  synthesize(prompt: string, config: LLMConfig): Promise<string>;
}

export interface SynthesisResult {
  task: SynthesisTask;
  content: string;
  provider: LLMProvider;
  model: string;
  generatedAt: string;
}

export interface SynthesisOptions {
  tasks: SynthesisTask[];
  config: LLMConfig;
  /** Blueprint to synthesize from. */
  blueprint: Blueprint;
}

/** Shape of .analythisrc.json */
export interface AnalythisRc {
  llm?: Partial<LLMConfig>;
}

/** Default models per provider */
export const DEFAULT_MODELS: Record<LLMProvider, string> = {
  anthropic: 'claude-sonnet-4-6',
  openai: 'gpt-4o',
  ollama: 'llama3'
};
