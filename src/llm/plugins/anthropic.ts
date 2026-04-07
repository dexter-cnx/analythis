import type { LLMPlugin, LLMConfig } from '../types';

export const anthropicPlugin: LLMPlugin = {
  name: 'anthropic',

  async synthesize(prompt: string, config: LLMConfig): Promise<string> {
    if (!config.apiKey) {
      throw new Error(
        'analythis: Anthropic API key is required. Set ANTHROPIC_API_KEY or add "apiKey" to .analythisrc.json.'
      );
    }

    // Dynamic import so @anthropic-ai/sdk is truly optional
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let Anthropic: any;
    try {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      ({ Anthropic } = require('@anthropic-ai/sdk'));
    } catch {
      throw new Error(
        'analythis: @anthropic-ai/sdk is not installed. Run: npm install @anthropic-ai/sdk'
      );
    }

    const client = new Anthropic({
      apiKey: config.apiKey,
      ...(config.baseUrl ? { baseURL: config.baseUrl } : {})
    });

    const response = await client.messages.create({
      model: config.model,
      max_tokens: config.maxTokens ?? 2048,
      messages: [{ role: 'user', content: prompt }]
    });

    const block = response.content?.[0];
    if (block?.type === 'text') return block.text as string;
    throw new Error('analythis: Anthropic returned an unexpected response format.');
  }
};
