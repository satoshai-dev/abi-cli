import { describe, it, expect } from 'vitest';
import { resolveNetwork } from '../../src/network.js';

describe('resolveNetwork', () => {
  it('resolves mainnet', () => {
    expect(resolveNetwork('mainnet')).toBe('https://api.hiro.so');
  });

  it('resolves testnet', () => {
    expect(resolveNetwork('testnet')).toBe('https://api.testnet.hiro.so');
  });

  it('resolves devnet', () => {
    expect(resolveNetwork('devnet')).toBe('http://localhost:3999');
  });

  it('accepts a custom URL', () => {
    expect(resolveNetwork('https://my-node.example.com')).toBe(
      'https://my-node.example.com',
    );
  });

  it('strips trailing slashes from custom URLs', () => {
    expect(resolveNetwork('https://my-node.example.com/')).toBe(
      'https://my-node.example.com',
    );
  });

  it('throws on invalid network name', () => {
    expect(() => resolveNetwork('invalid')).toThrow(
      'Invalid network "invalid"',
    );
  });
});
