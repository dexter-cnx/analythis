export declare function ensureDir(dir: string): void;
export declare function writeJson(filePath: string, data: unknown): void;
export declare function writeText(filePath: string, content: string): void;
export declare function readJson<T>(filePath: string): T;
/** Shared file-count limits used across all inspectors. */
export declare const FILE_LIMITS: {
    /** Shallow / fast pass. */
    readonly shallow: 300;
    /** Standard inspector depth. */
    readonly standard: 1000;
    /** Import-graph scan. */
    readonly graph: 500;
    /** Full deep scan (default when not shallow). */
    readonly deep: 3000;
};
export declare function listFilesRecursive(root: string, options?: {
    shallow?: boolean;
    maxFiles?: number;
    onTruncated?: (limit: number) => void;
}): string[];
export declare function detectLanguageFromExtension(file: string): string | null;
export declare function uniq(values: string[]): string[];
export declare function readTextSafe(filePath: string): string;
export declare function fileExists(filePath: string): boolean;
export declare function run(command: string, cwd?: string): string;
export declare function sanitizeName(input: string): string;
