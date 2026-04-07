import type { LLMPlugin, LLMConfig } from '../types';

const DEFAULT_OLLAMA_BASE_URL = 'http://localhost:11434';

export const ollamaPlugin: LLMPlugin = {
  name: 'ollama',

  async synthesize(prompt: string, config: LLMConfig): Promise<string> {
    const baseUrl = (config.baseUrl ?? DEFAULT_OLLAMA_BASE_URL).replace(/\/$/, '');
    const url = `${baseUrl}/api/generate`;

    let response: Response;
    try {
      response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: config.model,
          prompt,
          stream: false,
          options: { num_predict: config.maxTokens ?? 2048 }
        })
      });
    } catch (err) {
      throw new Error(
        `analythis: Could not connect to Ollama at ${baseUrl}. Make sure Ollama is running (ollama serve). Original error: ${String(err)}`
      );
    }

    if (!response.ok) {
      const body = await response.text().catch(() => '');
      throw new Error(
        `analythis: Ollama returned HTTP ${response.status}. ${body}`
      );
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const data = await response.json() as any;
    if (typeof data.response === 'string') return data.response;
    throw new Error('analythis: Ollama returned an unexpected response format.');
  }
};
