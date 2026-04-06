import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import {
  detectLanguageFromExtension,
  listFilesRecursive,
  sanitizeName,
  uniq,
  fileExists,
  readTextSafe,
} from '../src/utils';

describe('detectLanguageFromExtension', () => {
  it.each([
    ['file.ts', 'TypeScript'],
    ['file.tsx', 'TypeScript'],
    ['file.js', 'JavaScript'],
    ['file.dart', 'Dart'],
    ['file.py', 'Python'],
    ['file.go', 'Go'],
    ['file.rs', 'Rust'],
    ['file.java', 'Java'],
    ['file.cs', 'C#'],
    ['file.rb', 'Ruby'],
  ])('%s → %s', (file, expected) => {
    expect(detectLanguageFromExtension(file)).toBe(expected);
  });

  it('returns null for unknown extension', () => {
    expect(detectLanguageFromExtension('file.xyz')).toBeNull();
  });

  it('returns null for no extension', () => {
    expect(detectLanguageFromExtension('Makefile')).toBeNull();
  });
});

describe('uniq', () => {
  it('removes duplicates and sorts', () => {
    expect(uniq(['b', 'a', 'b', 'c', 'a'])).toEqual(['a', 'b', 'c']);
  });

  it('filters out empty strings', () => {
    expect(uniq(['a', '', 'b', ''])).toEqual(['a', 'b']);
  });

  it('returns empty array for empty input', () => {
    expect(uniq([])).toEqual([]);
  });
});

describe('sanitizeName', () => {
  it('replaces unsafe characters with dashes', () => {
    expect(sanitizeName('my repo/name!')).toBe('my-repo-name-');
  });

  it('allows alphanumeric, dots, underscores, dashes', () => {
    expect(sanitizeName('my_repo-1.0')).toBe('my_repo-1.0');
  });
});

describe('fileExists', () => {
  it('returns true for an existing file', () => {
    expect(fileExists(path.join(__dirname, 'utils.test.ts'))).toBe(true);
  });

  it('returns false for a non-existent file', () => {
    expect(fileExists('/nonexistent/path/file.ts')).toBe(false);
  });
});

describe('readTextSafe', () => {
  it('reads file content', () => {
    const tmp = path.join(os.tmpdir(), 'analythis-test-read.txt');
    fs.writeFileSync(tmp, 'hello');
    expect(readTextSafe(tmp)).toBe('hello');
    fs.unlinkSync(tmp);
  });

  it('returns empty string for missing file', () => {
    expect(readTextSafe('/nonexistent/file.txt')).toBe('');
  });
});

describe('listFilesRecursive', () => {
  const fixture = path.join(__dirname, 'fixtures', 'simple-node');

  it('lists files recursively', () => {
    const files = listFilesRecursive(fixture);
    expect(files).toContain('package.json');
    expect(files).toContain('README.md');
    expect(files.some(f => f.includes('src'))).toBe(true);
  });

  it('respects shallow + maxFiles limit', () => {
    const files = listFilesRecursive(fixture, { shallow: true, maxFiles: 2 });
    expect(files.length).toBeLessThanOrEqual(2);
  });
});
