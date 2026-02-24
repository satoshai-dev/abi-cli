import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { fetchCommand } from '../../src/commands/fetch.js';
import { sampleAbi } from './fixtures.js';
import { writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';

vi.mock('node:fs/promises', () => ({
  writeFile: vi.fn(),
}));

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const runFetch = (args: Record<string, any>) =>
  fetchCommand.run!({ args, rawArgs: [], cmd: fetchCommand } as never);

function mockFetchSuccess(times = 1) {
  for (let i = 0; i < times; i++) {
    vi.mocked(globalThis.fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => sampleAbi,
    } as Response);
  }
}

describe('fetchCommand', () => {
  const originalFetch = globalThis.fetch;
  let errorSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    globalThis.fetch = vi.fn();
    errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.mocked(writeFile).mockResolvedValue();
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
    errorSpy.mockRestore();
    vi.restoreAllMocks();
  });

  describe('--stdout', () => {
    it('writes TypeScript to stdout', async () => {
      mockFetchSuccess();

      const chunks: string[] = [];
      const writeSpy = vi.spyOn(process.stdout, 'write').mockImplementation((chunk) => {
        chunks.push(String(chunk));
        return true;
      });

      await runFetch({
        contract: 'SP2PABAF9FTAJYNFZH93XENAJ8FVY99RRM50D2JG9.nft-trait',
        network: 'mainnet',
        format: 'ts',
        stdout: true,
      });

      const output = chunks.join('');
      expect(output).toContain('export const abi =');
      expect(output).toContain('as const;');
      expect(output).toContain('"transfer"');

      writeSpy.mockRestore();
    });

    it('writes JSON to stdout', async () => {
      mockFetchSuccess();

      const chunks: string[] = [];
      const writeSpy = vi.spyOn(process.stdout, 'write').mockImplementation((chunk) => {
        chunks.push(String(chunk));
        return true;
      });

      await runFetch({
        contract: 'SP2PABAF9FTAJYNFZH93XENAJ8FVY99RRM50D2JG9.nft-trait',
        network: 'mainnet',
        format: 'json',
        stdout: true,
      });

      const output = chunks.join('');
      const parsed = JSON.parse(output);
      expect(parsed.functions).toBeDefined();
      expect(parsed.functions.length).toBe(4);

      writeSpy.mockRestore();
    });

    it('errors with multiple contracts', async () => {
      await expect(
        runFetch({
          contract: 'SP1.a,SP2.b',
          network: 'mainnet',
          format: 'ts',
          stdout: true,
        }),
      ).rejects.toThrow('--stdout cannot be used with multiple contracts');
    });
  });

  describe('--output', () => {
    it('writes to the specified file path', async () => {
      mockFetchSuccess();

      await runFetch({
        contract: 'SP2PABAF9FTAJYNFZH93XENAJ8FVY99RRM50D2JG9.nft-trait',
        network: 'mainnet',
        format: 'ts',
        stdout: false,
        output: 'custom-output.ts',
      });

      expect(writeFile).toHaveBeenCalledWith(
        resolve('custom-output.ts'),
        expect.stringContaining('export const abi ='),
        'utf-8',
      );
    });

    it('errors with multiple contracts', async () => {
      await expect(
        runFetch({
          contract: 'SP1.a,SP2.b',
          network: 'mainnet',
          format: 'ts',
          stdout: false,
          output: 'out.ts',
        }),
      ).rejects.toThrow('--output cannot be used with multiple contracts');
    });
  });

  describe('default file writing', () => {
    it('writes to default filename derived from contract name', async () => {
      mockFetchSuccess();

      await runFetch({
        contract: 'SP2PABAF9FTAJYNFZH93XENAJ8FVY99RRM50D2JG9.nft-trait',
        network: 'mainnet',
        format: 'ts',
        stdout: false,
      });

      expect(writeFile).toHaveBeenCalledWith(
        resolve('nft-trait.ts'),
        expect.stringContaining('export const abi ='),
        'utf-8',
      );
    });

    it('uses .json extension for json format', async () => {
      mockFetchSuccess();

      await runFetch({
        contract: 'SP2PABAF9FTAJYNFZH93XENAJ8FVY99RRM50D2JG9.nft-trait',
        network: 'mainnet',
        format: 'json',
        stdout: false,
      });

      expect(writeFile).toHaveBeenCalledWith(
        resolve('nft-trait.json'),
        expect.any(String),
        'utf-8',
      );
    });

    it('writes separate files for multiple contracts', async () => {
      mockFetchSuccess(2);

      await runFetch({
        contract: 'SP1.token-a,SP2.token-b',
        network: 'mainnet',
        format: 'ts',
        stdout: false,
      });

      expect(writeFile).toHaveBeenCalledTimes(2);
      expect(writeFile).toHaveBeenCalledWith(
        resolve('token-a.ts'),
        expect.stringContaining('export const abi ='),
        'utf-8',
      );
      expect(writeFile).toHaveBeenCalledWith(
        resolve('token-b.ts'),
        expect.stringContaining('export const abi ='),
        'utf-8',
      );
    });
  });

  describe('validation', () => {
    it('throws on invalid format', async () => {
      await expect(
        runFetch({
          contract: 'SP2P.nft-trait',
          network: 'mainnet',
          format: 'yaml',
          stdout: true,
        }),
      ).rejects.toThrow('Invalid format "yaml"');
    });

    it('validates network before fetching', async () => {
      await expect(
        runFetch({
          contract: 'SP1.token',
          network: 'badnet',
          format: 'ts',
          stdout: true,
        }),
      ).rejects.toThrow('Invalid network "badnet"');

      expect(globalThis.fetch).not.toHaveBeenCalled();
    });
  });
});
