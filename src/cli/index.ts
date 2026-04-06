#!/usr/bin/env node
import { Command } from 'commander';
import { runAnalyze } from './commands/analyze';
import { runInspect } from './commands/inspect';
import { runExport } from './commands/export';
import type { AnalyzeOptions, ExportOptions } from '../core/types/options';
import type { ProfileName } from '../core/types/inventory';

const program = new Command();

program
  .name('analythis')
  .description('Framework-agnostic repository analysis engine')
  .version('1.0.0');

program
  .command('analyze')
  .argument('<path-or-url>', 'local repository path or Git URL')
  .option('--profile <name>', 'generic | web | backend | mobile | monorepo | library', 'generic')
  .option('--focus <items>', 'comma-separated focus areas', '')
  .option('--output <dir>', 'output directory', '.analythis')
  .option('--format <type>', 'json | md | both', 'both')
  .option('--branch <name>', 'branch name for remote Git repositories')
  .option('--shallow', 'faster, lighter analysis', false)
  .option('--verbose', 'verbose logging', false)
  .action(async (input: string, opts: Record<string, unknown>) => {
    const options: AnalyzeOptions = {
      profile: (opts.profile as ProfileName) ?? 'generic',
      focusAreas: String(opts.focus ?? '').split(',').map((v) => v.trim()).filter(Boolean),
      outputDir: String(opts.output ?? '.analythis'),
      format: ((opts.format as AnalyzeOptions['format']) ?? 'both'),
      branch: opts.branch ? String(opts.branch) : undefined,
      shallow: Boolean(opts.shallow),
      verbose: Boolean(opts.verbose)
    };
    await runAnalyze(input, options);
  });

program
  .command('inspect')
  .argument('<path-or-url>', 'local repository path or Git URL')
  .option('--output <dir>', 'output directory', '.analythis')
  .option('--branch <name>', 'branch name for remote Git repositories')
  .action(async (input: string, opts: Record<string, unknown>) => {
    await runInspect(input, String(opts.output ?? '.analythis'), opts.branch ? String(opts.branch) : undefined);
  });

program
  .command('export')
  .argument('<blueprint-json>', 'path to blueprint.json')
  .option('--to <type>', 'md | yaml', 'md')
  .option('--output <dir>', 'output directory', '.analythis-export')
  .action(async (input: string, opts: Record<string, unknown>) => {
    const options: ExportOptions = {
      to: (opts.to as ExportOptions['to']) ?? 'md',
      outputDir: String(opts.output ?? '.analythis-export')
    };
    await runExport(input, options);
  });

program.parseAsync(process.argv).catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
