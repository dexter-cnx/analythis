"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.runAnalyze = runAnalyze;
const path = __importStar(require("path"));
const analyzer_1 = require("../../core/engine/analyzer");
const resolve_input_1 = require("../../intake/resolve-input");
const markdown_1 = require("../../exporters/markdown");
const import_graph_inspector_1 = require("../../inspectors/import-graph-inspector");
const graph_1 = require("../../exporters/graph");
const synthesizer_1 = require("../../llm/synthesizer");
const config_1 = require("../../llm/config");
const llm_1 = require("../../exporters/llm");
const utils_1 = require("../../utils");
async function runAnalyze(input, options) {
    // Validate LLM config before cloning/scanning — fail fast with a clear message.
    if (options.llm && options.llm.tasks.length > 0) {
        const llmConfig = (0, config_1.resolveLLMConfig)({
            provider: options.llm.provider,
            model: options.llm.model
        });
        (0, config_1.validateLLMConfig)(llmConfig);
    }
    const resolved = (0, resolve_input_1.resolveInput)(input, options.branch);
    try {
        const outputDir = path.resolve(options.outputDir);
        (0, utils_1.ensureDir)(outputDir);
        const result = (0, analyzer_1.analyzeRepository)(resolved.workingRoot, options);
        (0, utils_1.writeJson)(path.join(outputDir, 'inventory.json'), result.inventory);
        (0, utils_1.writeJson)(path.join(outputDir, 'blueprint.json'), result.blueprint);
        (0, utils_1.writeJson)(path.join(outputDir, 'prompt-pack.json'), result.promptPack);
        (0, markdown_1.exportInventoryMarkdown)(result.inventory, outputDir);
        if (options.format === 'md' || options.format === 'both') {
            (0, markdown_1.exportBlueprintMarkdown)(result.blueprint, outputDir);
            (0, markdown_1.exportPromptPackMarkdown)(result.promptPack, outputDir);
        }
        if (options.graph) {
            const graph = (0, import_graph_inspector_1.buildImportGraph)(resolved.workingRoot, options.shallow);
            (0, graph_1.exportImportGraph)(graph, outputDir);
            console.log(`Import graph: ${graph.nodes.filter((n) => n.language !== 'external').length} files, ${graph.edges.filter((e) => e.type === 'internal').length} internal edges`);
        }
        if (options.llm && options.llm.tasks.length > 0) {
            const llmConfig = (0, config_1.resolveLLMConfig)({ provider: options.llm.provider, model: options.llm.model });
            console.log(`Running LLM synthesis (${llmConfig.provider} / ${llmConfig.model}) for: ${options.llm.tasks.join(', ')}...`);
            const llmResults = await (0, synthesizer_1.synthesize)({
                tasks: options.llm.tasks,
                config: llmConfig,
                blueprint: result.blueprint
            });
            (0, llm_1.exportLLMResults)(llmResults, outputDir);
            console.log(`LLM output: ${outputDir}/llm/`);
        }
        console.log(`analythis analyze completed.`);
        console.log(`Output: ${outputDir}`);
    }
    finally {
        resolved.cleanup();
    }
}
