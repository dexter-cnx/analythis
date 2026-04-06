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
const utils_1 = require("../../utils");
async function runAnalyze(input, options) {
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
        console.log(`analythis analyze completed.`);
        console.log(`Output: ${outputDir}`);
    }
    finally {
        resolved.cleanup();
    }
}
