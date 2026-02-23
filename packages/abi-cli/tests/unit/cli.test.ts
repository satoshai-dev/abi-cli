import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { parseContractId } from '../../src/fetcher.js';
import { generateTypescript, generateJson } from '../../src/codegen.js';
import { sampleAbi } from './fixtures.js';

describe('CLI integration', () => {
  const originalFetch = globalThis.fetch;

  beforeEach(() => {
    globalThis.fetch = vi.fn();
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  it('end-to-end: parse contract, fetch ABI, generate TypeScript', async () => {
    vi.mocked(globalThis.fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => sampleAbi,
    } as Response);

    const contractId = 'SP2PABAF9FTAJYNFZH93XENAJ8FVY99RRM50D2JG9.nft-trait';
    const { address, name } = parseContractId(contractId);

    expect(address).toBe('SP2PABAF9FTAJYNFZH93XENAJ8FVY99RRM50D2JG9');
    expect(name).toBe('nft-trait');

    const response = await globalThis.fetch(
      `https://api.hiro.so/v2/contracts/interface/${address}/${name}`,
    );
    const abi = await (response as Response).json();

    const tsOutput = generateTypescript(contractId, abi);
    expect(tsOutput).toContain('export const abi =');
    expect(tsOutput).toContain('as const;');
    expect(tsOutput).toContain('"transfer"');
  });

  it('end-to-end: parse contract, fetch ABI, generate JSON', async () => {
    vi.mocked(globalThis.fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => sampleAbi,
    } as Response);

    const contractId = 'SP2PABAF9FTAJYNFZH93XENAJ8FVY99RRM50D2JG9.nft-trait';
    const { address, name } = parseContractId(contractId);

    const response = await globalThis.fetch(
      `https://api.hiro.so/v2/contracts/interface/${address}/${name}`,
    );
    const abi = await (response as Response).json();

    const jsonOutput = generateJson(abi);
    const parsed = JSON.parse(jsonOutput);
    expect(parsed.functions).toBeDefined();
    expect(parsed.functions.length).toBe(4);
  });
});
