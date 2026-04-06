export interface ResolvedInput {
    workingRoot: string;
    cleanup: () => void;
}
export declare function resolveInput(input: string, branch?: string): ResolvedInput;
