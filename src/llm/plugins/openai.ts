import type { LLMPlugin, LLMConfig } from '../types';

export const openaiPlugin: LLMPlugin = {
  name: 'openai',

  async synthesize(prompt: string, config: LLMConfig): Promise<string> {
    if (!config.apiKey) {
      throw new Error(
        'analythis: OpenAI API key is required. Set OPENAI_API_KEY or add "apiKey" to .analythisrc.json.'
      );
    }

    // Dynamic import so openai is truly optional
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let OpenAI: any;
    try {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      ({ OpenAI } = require('openai'));
    } catch {
      throw new Error(
        'analythis: openai is not installed. Run: npm install openai'
      );
    }

    const client = new OpenAI({
      apiKey: config.apiKey,
      ...(config.baseUrl ? { baseURL: config.baseUrl } : {})
    });

    const response = await client.chat.completions.create({
      model: config.model,
      max_tokens: config.maxTokens ?? 2048,
      messages: [{ role: 'user', content: prompt }]
    });

    const content = response.choices?.[0]?.message?.content;
    if (typeof content === 'string') return content;
    throw new Error('analythis: OpenAI returned an unexpected response format.');
  }
};
