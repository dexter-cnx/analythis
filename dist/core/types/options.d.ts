import type { ProfileName } from './inventory';
import type { SynthesisTask } from '../../llm/types';
export interface LLMOptions {
    tasks: SynthesisTask[];
    /** Provider override (anthropic | openai | ollama). Reads .analythisrc.json if omitted. */
    provider?: string;
    /** Model override. Reads .analythisrc.json / default if omitted. */
    model?: string;
}
export interface AnalyzeOptions {
    profile: ProfileName;
    focusAreas: string[];
    outputDir: string;
    format: 'json' | 'md' | 'both';
    branch?: string;
    shallow: boolean;
    verbose: boolean;
    graph: boolean;
    llm?: LLMOptions;
}
export interface ExportOptions {
    to: 'md' | 'yaml';
    outputDir: string;
}
export interface CompareOptions {
    outputDir: string;
    format: 'json' | 'md' | 'both';
    branch?: string;
    shallow: boolean;
}
