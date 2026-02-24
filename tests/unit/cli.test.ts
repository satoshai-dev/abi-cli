import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { fetchCommand } from '../../src/commands/fetch.js';
import { sampleAbi } from './fixtures.js';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const runFetch = (args: Record<string, any>) =>
  fetchCommand.run!({ args, rawArgs: [], cmd: fetchCommand } as never);

describe('fetchCommand', () => {
  const originalFetch = globalThis.fetch;

  beforeEach(() => {
    globalThis.fetch = vi.fn();
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  it('writes TypeScript to stdout', async () => {
    vi.mocked(globalThis.fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => sampleAbi,
    } as Response);

    const chunks: string[] = [];
    const writeSpy = vi.spyOn(process.stdout, 'write').mockImplementation((chunk) => {
      chunks.push(String(chunk));
      return true;
    });
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

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
    errorSpy.mockRestore();
  });

  it('writes JSON to stdout', async () => {
    vi.mocked(globalThis.fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => sampleAbi,
    } as Response);

    const chunks: string[] = [];
    const writeSpy = vi.spyOn(process.stdout, 'write').mockImplementation((chunk) => {
      chunks.push(String(chunk));
      return true;
    });
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

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
    errorSpy.mockRestore();
  });

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
});
