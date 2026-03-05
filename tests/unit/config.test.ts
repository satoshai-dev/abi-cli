import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { validateConfig, loadConfig } from '../../src/config.js';
import { readFile } from 'node:fs/promises';

vi.mock('node:fs/promises', () => ({
  readFile: vi.fn(),
}));

describe('validateConfig', () => {
  it('accepts a valid minimal config', () => {
    const result = validateConfig({
      outDir: './abis',
      contracts: [{ id: 'SP1.token-a' }],
    });

    expect(result.outDir).toBe('./abis');
    expect(result.contracts).toEqual([{ id: 'SP1.token-a' }]);
    expect(result.format).toBeUndefined();
    expect(result.network).toBeUndefined();
  });

  it('accepts a valid full config', () => {
    const result = validateConfig({
      outDir: './abis',
      format: 'json',
      network: 'testnet',
      contracts: [
        { id: 'SP1.token-a' },
        { id: 'SP2.token-b', network: 'mainnet' },
      ],
    });

    expect(result.outDir).toBe('./abis');
    expect(result.format).toBe('json');
    expect(result.network).toBe('testnet');
    expect(result.contracts).toHaveLength(2);
    expect(result.contracts[1].network).toBe('mainnet');
  });

  it('throws on missing outDir', () => {
    expect(() =>
      validateConfig({ contracts: [{ id: 'SP1.token' }] }),
    ).toThrow('"outDir" is required');
  });

  it('throws on missing contracts', () => {
    expect(() => validateConfig({ outDir: './abis' })).toThrow(
      '"contracts" is required',
    );
  });

  it('throws on empty contracts array', () => {
    expect(() =>
      validateConfig({ outDir: './abis', contracts: [] }),
    ).toThrow('"contracts" is required and must be a non-empty array');
  });

  it('throws on invalid format', () => {
    expect(() =>
      validateConfig({
        outDir: './abis',
        format: 'yaml',
        contracts: [{ id: 'SP1.token' }],
      }),
    ).toThrow('Invalid config "format"');
  });

  it('throws on invalid network', () => {
    expect(() =>
      validateConfig({
        outDir: './abis',
        network: 'badnet',
        contracts: [{ id: 'SP1.token' }],
      }),
    ).toThrow('Invalid network "badnet"');
  });

  it('throws on invalid contract ID', () => {
    expect(() =>
      validateConfig({
        outDir: './abis',
        contracts: [{ id: 'not-a-valid-id' }],
      }),
    ).toThrow('Invalid contract ID');
  });

  it('accepts contracts with name alias', () => {
    const result = validateConfig({
      outDir: './abis',
      contracts: [
        { id: 'SP102V8P0F7JX67ARQ77WEA3D3CFB5XW39REDT0AM.amm-pool-v2-01', name: 'amm-pool' },
      ],
    });

    expect(result.contracts[0].name).toBe('amm-pool');
  });

  it('throws on invalid name value', () => {
    expect(() =>
      validateConfig({
        outDir: './abis',
        contracts: [{ id: 'SP1.token', name: '' }],
      }),
    ).toThrow('invalid "name" value');
  });

  it('throws on duplicate resolved names', () => {
    expect(() =>
      validateConfig({
        outDir: './abis',
        contracts: [
          { id: 'SP1.token' },
          { id: 'SP2.token' },
        ],
      }),
    ).toThrow('Duplicate contract name "token"');
  });

  it('throws on duplicate names from alias collision', () => {
    expect(() =>
      validateConfig({
        outDir: './abis',
        contracts: [
          { id: 'SP1.token-a', name: 'token' },
          { id: 'SP2.token' },
        ],
      }),
    ).toThrow('Duplicate contract name "token"');
  });

  it('allows same contract name when disambiguated with name alias', () => {
    const result = validateConfig({
      outDir: './abis',
      contracts: [
        { id: 'SP1.token', name: 'token-v1' },
        { id: 'SP2.token', name: 'token-v2' },
      ],
    });

    expect(result.contracts).toHaveLength(2);
  });

  it('throws on non-object input', () => {
    expect(() => validateConfig('string')).toThrow('Config must be an object');
    expect(() => validateConfig(null)).toThrow('Config must be an object');
    expect(() => validateConfig([])).toThrow('Config must be an object');
  });
});

describe('loadConfig', () => {
  beforeEach(() => {
    vi.mocked(readFile).mockReset();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('loads from an explicit JSON path', async () => {
    vi.mocked(readFile).mockResolvedValueOnce(
      JSON.stringify({
        outDir: './abis',
        contracts: [{ id: 'SP1.token' }],
      }),
    );

    const config = await loadConfig('/tmp/my-config.json');

    expect(readFile).toHaveBeenCalledWith(
      expect.stringContaining('my-config.json'),
      'utf-8',
    );
    expect(config.outDir).toBe('./abis');
  });

  it('discovers abi.config.json by default', async () => {
    vi.mocked(readFile).mockResolvedValueOnce(
      JSON.stringify({
        outDir: './out',
        contracts: [{ id: 'SP1.nft' }],
      }),
    );

    const config = await loadConfig();

    expect(readFile).toHaveBeenCalledWith(
      expect.stringContaining('abi.config.json'),
      'utf-8',
    );
    expect(config.outDir).toBe('./out');
  });

  it('falls back to abi.config.ts when json not found', async () => {
    const notFound = Object.assign(new Error('ENOENT'), { code: 'ENOENT' });
    vi.mocked(readFile).mockRejectedValueOnce(notFound);

    // TS loading goes through jiti — mock the jiti import
    const mockImport = vi.fn().mockResolvedValue({
      outDir: './from-ts',
      contracts: [{ id: 'SP1.ts-contract' }],
    });
    const mockJiti = vi.fn().mockReturnValue({ import: mockImport });
    vi.doMock('jiti', () => ({ default: mockJiti }));

    // Need to re-import to pick up the mock
    const { loadConfig: loadConfigFresh } = await import('../../src/config.js');
    const config = await loadConfigFresh();

    expect(config.outDir).toBe('./from-ts');

    vi.doUnmock('jiti');
  });

  it('throws when no config file is found', async () => {
    const notFound = Object.assign(new Error('ENOENT'), { code: 'ENOENT' });
    vi.mocked(readFile).mockRejectedValue(notFound);

    // Also mock jiti to fail with ENOENT for .ts discovery
    const mockImport = vi.fn().mockRejectedValue(notFound);
    const mockJiti = vi.fn().mockReturnValue({ import: mockImport });
    vi.doMock('jiti', () => ({ default: mockJiti }));

    const { loadConfig: loadConfigFresh } = await import('../../src/config.js');

    await expect(loadConfigFresh()).rejects.toThrow('No config file found');

    vi.doUnmock('jiti');
  });

  it('throws on invalid JSON content', async () => {
    vi.mocked(readFile).mockResolvedValueOnce('not json {{{');

    await expect(loadConfig('/tmp/bad.json')).rejects.toThrow(
      'Failed to parse JSON config',
    );
  });

  it('propagates validation errors from loaded config', async () => {
    vi.mocked(readFile).mockResolvedValueOnce(
      JSON.stringify({ outDir: './abis' }),
    );

    await expect(loadConfig('/tmp/missing-contracts.json')).rejects.toThrow(
      '"contracts" is required',
    );
  });
});
