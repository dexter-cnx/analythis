#!/usr/bin/env node
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const commander_1 = require("commander");
const analyze_1 = require("./commands/analyze");
const inspect_1 = require("./commands/inspect");
const export_1 = require("./commands/export");
const program = new commander_1.Command();
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
    .action(async (input, opts) => {
    const options = {
        profile: opts.profile ?? 'generic',
        focusAreas: String(opts.focus ?? '').split(',').map((v) => v.trim()).filter(Boolean),
        outputDir: String(opts.output ?? '.analythis'),
        format: (opts.format ?? 'both'),
        branch: opts.branch ? String(opts.branch) : undefined,
        shallow: Boolean(opts.shallow),
        verbose: Boolean(opts.verbose)
    };
    await (0, analyze_1.runAnalyze)(input, options);
});
program
    .command('inspect')
    .argument('<path-or-url>', 'local repository path or Git URL')
    .option('--output <dir>', 'output directory', '.analythis')
    .option('--branch <name>', 'branch name for remote Git repositories')
    .action(async (input, opts) => {
    await (0, inspect_1.runInspect)(input, String(opts.output ?? '.analythis'), opts.branch ? String(opts.branch) : undefined);
});
program
    .command('export')
    .argument('<blueprint-json>', 'path to blueprint.json')
    .option('--to <type>', 'md | yaml', 'md')
    .option('--output <dir>', 'output directory', '.analythis-export')
    .action(async (input, opts) => {
    const options = {
        to: opts.to ?? 'md',
        outputDir: String(opts.output ?? '.analythis-export')
    };
    await (0, export_1.runExport)(input, options);
});
program.parseAsync(process.argv).catch((error) => {
    console.error(error instanceof Error ? error.message : String(error));
    process.exit(1);
});
