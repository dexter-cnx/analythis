import type { ProfileName } from './inventory';

export interface AnalyzeOptions {
  profile: ProfileName;
  focusAreas: string[];
  outputDir: string;
  format: 'json' | 'md' | 'both';
  branch?: string;
  shallow: boolean;
  verbose: boolean;
  graph: boolean;
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
