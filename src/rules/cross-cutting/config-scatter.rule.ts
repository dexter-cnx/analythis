import type { AnalysisRule, RuleResult } from '../types';

const SCATTER_THRESHOLD = 4;

export const configScatterRule: AnalysisRule = {
  id: 'cross/config-scatter',
  title: 'Configuration Scatter',
  description: 'Detects configuration spread across many files or locations.',
  severity: 'low',
  ruleGroups: ['cross-cutting'],
  profiles: [],
  enabled: true,
  evaluate({ blueprint }): RuleResult[] {
    // blueprint.configuration is already pre-filtered by the manifest inspector;
    // count all entries rather than applying a redundant regex.
    const configItems = blueprint.configuration;

    if (configItems.length >= SCATTER_THRESHOLD) {
      return [
        {
          ruleId: 'cross/config-scatter',
          title: `Configuration scattered across ${configItems.length} locations`,
          severity: 'low',
          summary: `${configItems.length} configuration files detected — may be harder to audit.`,
          details:
            `Many config files spread across the project make it hard to understand the ` +
            `full configuration surface, especially for environment-specific settings. ` +
            `Sensitive values can drift into unexpected places.`,
          affectedPaths: configItems,
          suggestions: [
            `Centralise environment variables under a single config/ module with validation.`,
            `Use a typed config loader (e.g. zod, envalid) to validate at startup.`,
            `Document which config values are required per environment in a config.example.env.`
          ]
        }
      ];
    }

    return [];
  }
};
