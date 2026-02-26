import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { syncCommand } from '../../src/commands/sync.js';
import { sampleAbi } from './fixtures.js';
import { writeFile, mkdir, readFile } from 'node:fs/promises';
import { resolve, join } from 'node:path';

vi.mock('node:fs/promises', () => ({
  writeFile: vi.fn(),
  mkdir: vi.fn(),
  readFile: vi.fn(),
}));

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const runSync = (args: Record<string, any>) =>
  syncCommand.run!({ args, rawArgs: [], cmd: syncCommand } as never);

function mockFetchSuccess(times = 1) {
  for (let i = 0; i < times; i++) {
    vi.mocked(globalThis.fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => sampleAbi,
    } as Response);
  }
}

function mockConfig(config: object) {
  vi.mocked(readFile).mockResolvedValueOnce(JSON.stringify(config));
}

describe('syncCommand', () => {
  const originalFetch = globalThis.fetch;
  let errorSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    globalThis.fetch = vi.fn();
    errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.mocked(writeFile).mockResolvedValue();
    vi.mocked(mkdir).mockResolvedValue(undefined);
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
    errorSpy.mockRestore();
    vi.restoreAllMocks();
  });

  it('syncs all contracts from config', async () => {
    mockConfig({
      outDir: './abis',
      contracts: [{ id: 'SP1.token-a' }, { id: 'SP2.token-b' }],
    });
    mockFetchSuccess(2);

    await runSync({ config: '/tmp/abi.config.json' });

    expect(mkdir).toHaveBeenCalledWith(resolve('./abis'), { recursive: true });
    expect(writeFile).toHaveBeenCalledTimes(2);
    expect(writeFile).toHaveBeenCalledWith(
      join(resolve('./abis'), 'token-a.ts'),
      expect.stringContaining('export const abi ='),
      'utf-8',
    );
    expect(writeFile).toHaveBeenCalledWith(
      join(resolve('./abis'), 'token-b.ts'),
      expect.stringContaining('export const abi ='),
      'utf-8',
    );
  });

  it('creates outDir with recursive: true', async () => {
    mockConfig({
      outDir: './deep/nested/abis',
      contracts: [{ id: 'SP1.token' }],
    });
    mockFetchSuccess();

    await runSync({ config: '/tmp/abi.config.json' });

    expect(mkdir).toHaveBeenCalledWith(resolve('./deep/nested/abis'), {
      recursive: true,
    });
  });

  it('respects top-level format and network', async () => {
    mockConfig({
      outDir: './abis',
      format: 'json',
      network: 'testnet',
      contracts: [{ id: 'SP1.token' }],
    });
    mockFetchSuccess();

    await runSync({ config: '/tmp/abi.config.json' });

    expect(globalThis.fetch).toHaveBeenCalledWith(
      expect.stringContaining('api.testnet.hiro.so'),
    );
    expect(writeFile).toHaveBeenCalledWith(
      join(resolve('./abis'), 'token.json'),
      expect.any(String),
      'utf-8',
    );
  });

  it('per-contract network overrides top-level', async () => {
    mockConfig({
      outDir: './abis',
      network: 'testnet',
      contracts: [{ id: 'SP1.token', network: 'mainnet' }],
    });
    mockFetchSuccess();

    await runSync({ config: '/tmp/abi.config.json' });

    expect(globalThis.fetch).toHaveBeenCalledWith(
      expect.stringContaining('api.hiro.so'),
    );
  });

  it('continues on partial failure and throws summary', async () => {
    mockConfig({
      outDir: './abis',
      contracts: [
        { id: 'SP1.token-a' },
        { id: 'SP2.token-b' },
        { id: 'SP3.token-c' },
      ],
    });
    mockFetchSuccess(); // SP1.token-a succeeds
    vi.mocked(globalThis.fetch).mockRejectedValueOnce(new Error('network error')); // SP2 fails
    mockFetchSuccess(); // SP3.token-c succeeds

    await expect(runSync({ config: '/tmp/abi.config.json' })).rejects.toThrow(
      'Failed to sync: SP2.token-b',
    );

    // Still wrote 2 successful contracts
    expect(writeFile).toHaveBeenCalledTimes(2);
  });

  it('throws when config not found', async () => {
    const notFound = Object.assign(new Error('ENOENT'), { code: 'ENOENT' });
    vi.mocked(readFile).mockRejectedValue(notFound);

    // Also mock jiti for .ts fallback
    const mockImport = vi.fn().mockRejectedValue(notFound);
    const mockJiti = vi.fn().mockReturnValue({ import: mockImport });
    vi.doMock('jiti', () => ({ default: mockJiti }));

    const { syncCommand: syncFresh } = await import(
      '../../src/commands/sync.js'
    );
    const runSyncFresh = (args: Record<string, unknown>) =>
      syncFresh.run!({ args, rawArgs: [], cmd: syncFresh } as never);

    await expect(runSyncFresh({})).rejects.toThrow('No config file found');

    vi.doUnmock('jiti');
  });

  it('uses custom --config path', async () => {
    mockConfig({
      outDir: './custom-out',
      contracts: [{ id: 'SP1.my-contract' }],
    });
    mockFetchSuccess();

    await runSync({ config: '/path/to/custom.json' });

    expect(readFile).toHaveBeenCalledWith('/path/to/custom.json', 'utf-8');
    expect(writeFile).toHaveBeenCalledWith(
      join(resolve('./custom-out'), 'my-contract.ts'),
      expect.stringContaining('export const abi ='),
      'utf-8',
    );
  });
});
