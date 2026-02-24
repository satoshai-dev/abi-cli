import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { parseContractId, fetchContractAbi } from '../../src/fetcher.js';
import { sampleAbi } from './fixtures.js';

describe('parseContractId', () => {
  it('parses a valid contract ID', () => {
    const result = parseContractId(
      'SP2PABAF9FTAJYNFZH93XENAJ8FVY99RRM50D2JG9.nft-trait',
    );
    expect(result).toEqual({
      address: 'SP2PABAF9FTAJYNFZH93XENAJ8FVY99RRM50D2JG9',
      name: 'nft-trait',
    });
  });

  it('throws on missing dot separator', () => {
    expect(() => parseContractId('SP2PABAF9FTAJYNFZH93XENAJ8FVY99RRM50D2JG9')).toThrow(
      'Invalid contract ID',
    );
  });

  it('throws on empty address', () => {
    expect(() => parseContractId('.nft-trait')).toThrow('Invalid contract ID');
  });

  it('throws on empty name', () => {
    expect(() => parseContractId('SP2PABAF9FTAJYNFZH93XENAJ8FVY99RRM50D2JG9.')).toThrow(
      'Invalid contract ID',
    );
  });

  it('throws on multiple dots', () => {
    expect(() => parseContractId('SP2P.nft.trait')).toThrow('Invalid contract ID');
  });
});

describe('fetchContractAbi', () => {
  const originalFetch = globalThis.fetch;

  beforeEach(() => {
    globalThis.fetch = vi.fn();
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  it('fetches and returns ABI on success', async () => {
    vi.mocked(globalThis.fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => sampleAbi,
    } as Response);

    const result = await fetchContractAbi(
      'mainnet',
      'SP2PABAF9FTAJYNFZH93XENAJ8FVY99RRM50D2JG9',
      'nft-trait',
    );

    expect(result).toEqual(sampleAbi);
    expect(globalThis.fetch).toHaveBeenCalledWith(
      'https://api.hiro.so/v2/contracts/interface/SP2PABAF9FTAJYNFZH93XENAJ8FVY99RRM50D2JG9/nft-trait',
    );
  });

  it('throws on 404', async () => {
    vi.mocked(globalThis.fetch).mockResolvedValueOnce({
      ok: false,
      status: 404,
      statusText: 'Not Found',
    } as Response);

    await expect(
      fetchContractAbi('mainnet', 'SP123', 'missing'),
    ).rejects.toThrow('Contract not found: SP123.missing on mainnet');
  });

  it('throws on other HTTP errors', async () => {
    vi.mocked(globalThis.fetch).mockResolvedValueOnce({
      ok: false,
      status: 500,
      statusText: 'Internal Server Error',
    } as Response);

    await expect(
      fetchContractAbi('mainnet', 'SP123', 'broken'),
    ).rejects.toThrow('Failed to fetch ABI for SP123.broken: 500 Internal Server Error');
  });

  it('uses the correct URL for testnet', async () => {
    vi.mocked(globalThis.fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => sampleAbi,
    } as Response);

    await fetchContractAbi('testnet', 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM', 'my-contract');

    expect(globalThis.fetch).toHaveBeenCalledWith(
      'https://api.testnet.hiro.so/v2/contracts/interface/ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM/my-contract',
    );
  });

  it('uses the correct URL for devnet', async () => {
    vi.mocked(globalThis.fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => sampleAbi,
    } as Response);

    await fetchContractAbi('devnet', 'ST123', 'my-contract');

    expect(globalThis.fetch).toHaveBeenCalledWith(
      'http://localhost:3999/v2/contracts/interface/ST123/my-contract',
    );
  });

  it('uses the correct URL for custom network', async () => {
    vi.mocked(globalThis.fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => sampleAbi,
    } as Response);

    await fetchContractAbi('https://custom.example.com', 'SP123', 'my-contract');

    expect(globalThis.fetch).toHaveBeenCalledWith(
      'https://custom.example.com/v2/contracts/interface/SP123/my-contract',
    );
  });

  it('throws on network error', async () => {
    vi.mocked(globalThis.fetch).mockRejectedValueOnce(new TypeError('fetch failed'));

    await expect(
      fetchContractAbi('mainnet', 'SP123', 'broken'),
    ).rejects.toThrow('Network error fetching ABI for SP123.broken on mainnet');
  });

  it('throws on invalid JSON response', async () => {
    vi.mocked(globalThis.fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => { throw new SyntaxError('Unexpected token'); },
    } as unknown as Response);

    await expect(
      fetchContractAbi('mainnet', 'SP123', 'broken'),
    ).rejects.toThrow('Invalid JSON response for SP123.broken on mainnet');
  });
});
