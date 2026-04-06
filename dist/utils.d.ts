export declare function ensureDir(dir: string): void;
export declare function writeJson(filePath: string, data: unknown): void;
export declare function writeText(filePath: string, content: string): void;
export declare function readJson<T>(filePath: string): T;
export declare function listFilesRecursive(root: string, options?: {
    shallow?: boolean;
    maxFiles?: number;
}): string[];
export declare function detectLanguageFromExtension(file: string): string | null;
export declare function uniq(values: string[]): string[];
export declare function readTextSafe(filePath: string): string;
export declare function fileExists(filePath: string): boolean;
export declare function run(command: string, cwd?: string): string;
export declare function sanitizeName(input: string): string;
