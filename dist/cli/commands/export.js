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
exports.runExport = runExport;
const path = __importStar(require("path"));
const markdown_1 = require("../../exporters/markdown");
const yaml_1 = require("../../exporters/yaml");
const utils_1 = require("../../utils");
async function runExport(inputFile, options) {
    const blueprint = (0, utils_1.readJson)(path.resolve(inputFile));
    const outputDir = path.resolve(options.outputDir);
    (0, utils_1.ensureDir)(outputDir);
    if (options.to === 'md') {
        (0, markdown_1.exportBlueprintMarkdown)(blueprint, outputDir);
    }
    else {
        (0, yaml_1.exportBlueprintYaml)(blueprint, outputDir);
    }
    console.log(`analythis export completed.`);
    console.log(`Output: ${outputDir}`);
}
