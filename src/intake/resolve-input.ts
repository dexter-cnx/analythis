import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { run, sanitizeName } from '../utils';

export interface ResolvedInput {
  workingRoot: string;
  cleanup: () => void;
}

export function resolveInput(input: string, branch?: string): ResolvedInput {
  if (fs.existsSync(input)) {
    return {
      workingRoot: path.resolve(input),
      cleanup: () => undefined
    };
  }

  if (/^https?:\/\//.test(input) || input.endsWith('.git')) {
    const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), `analythis-${sanitizeName(path.basename(input, '.git'))}-`));
    const branchPart = branch ? ` --branch ${branch}` : '';
    run(`git clone --depth 1${branchPart} ${input} ${tempRoot}`);
    return {
      workingRoot: tempRoot,
      cleanup: () => {
        fs.rmSync(tempRoot, { recursive: true, force: true });
      }
    };
  }

  throw new Error(`Input not found or unsupported: ${input}`);
}
