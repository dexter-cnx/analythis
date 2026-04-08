#!/usr/bin/env node
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const commander_1 = require("commander");
const analyze_1 = require("./commands/analyze");
const inspect_1 = require("./commands/inspect");
const export_1 = require("./commands/export");
const graph_1 = require("./commands/graph");
const compare_1 = require("./commands/compare");
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
    .option('--graph', 'also generate import graph (graph.json, graph.mmd, graph.dot)', false)
    .option('--llm-summarize', 'LLM: generate executive summary', false)
    .option('--llm-risks', 'LLM: generate deep risk analysis', false)
    .option('--llm-refactor', 'LLM: generate refactor plan', false)
    .option('--llm-onboard', 'LLM: generate onboarding guide', false)
    .option('--llm-provider <name>', 'LLM provider: anthropic | openai | ollama')
    .option('--llm-model <name>', 'LLM model name override')
    .action(async (input, opts) => {
    const llmTasks = [];
    if (opts.llmSummarize)
        llmTasks.push('summarize');
    if (opts.llmRisks)
        llmTasks.push('risks');
    if (opts.llmRefactor)
        llmTasks.push('refactor');
    if (opts.llmOnboard)
        llmTasks.push('onboard');
    const options = {
        profile: opts.profile ?? 'generic',
        focusAreas: String(opts.focus ?? '').split(',').map((v) => v.trim()).filter(Boolean),
        outputDir: String(opts.output ?? '.analythis'),
        format: (opts.format ?? 'both'),
        branch: opts.branch ? String(opts.branch) : undefined,
        shallow: Boolean(opts.shallow),
        verbose: Boolean(opts.verbose),
        graph: Boolean(opts.graph),
        llm: llmTasks.length > 0 ? {
            tasks: llmTasks,
            provider: opts.llmProvider ? String(opts.llmProvider) : undefined,
            model: opts.llmModel ? String(opts.llmModel) : undefined
        } : undefined
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
program
    .command('graph')
    .argument('<path-or-url>', 'local repository path or Git URL')
    .option('--output <dir>', 'output directory', '.analythis')
    .option('--branch <name>', 'branch name for remote Git repositories')
    .option('--shallow', 'faster, lighter analysis', false)
    .action(async (input, opts) => {
    await (0, graph_1.runGraph)(input, String(opts.output ?? '.analythis'), opts.branch ? String(opts.branch) : undefined, Boolean(opts.shallow));
});
program
    .command('compare')
    .argument('<paths...>', 'two or more local paths or Git URLs to compare')
    .option('--output <dir>', 'output directory', '.analythis-compare')
    .option('--format <type>', 'json | md | both', 'both')
    .option('--branch <name>', 'branch name for remote Git repositories')
    .option('--shallow', 'faster, lighter analysis', false)
    .action(async (inputs, opts) => {
    if (inputs.length < 2) {
        console.error('compare requires at least 2 paths/URLs');
        process.exit(1);
    }
    const options = {
        outputDir: String(opts.output ?? '.analythis-compare'),
        format: opts.format ?? 'both',
        branch: opts.branch ? String(opts.branch) : undefined,
        shallow: Boolean(opts.shallow)
    };
    await (0, compare_1.runCompare)(inputs, options);
});
program.parseAsync(process.argv).catch((error) => {
    console.error(error instanceof Error ? error.message : String(error));
    process.exit(1);
});
