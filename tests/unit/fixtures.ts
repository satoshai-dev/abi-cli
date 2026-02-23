import type { ClarityAbi } from '@stacks/transactions';

/**
 * Sample ABI matching the SIP-009 nft-trait interface.
 */
export const sampleAbi: ClarityAbi = {
  functions: [
    {
      name: 'transfer',
      access: 'public',
      args: [
        { name: 'token-id', type: 'uint128' },
        { name: 'sender', type: 'principal' },
        { name: 'recipient', type: 'principal' },
      ],
      outputs: {
        type: {
          response: { ok: 'bool', error: 'uint128' },
        },
      },
    },
    {
      name: 'get-owner',
      access: 'read_only',
      args: [{ name: 'token-id', type: 'uint128' }],
      outputs: {
        type: {
          response: {
            ok: { optional: 'principal' },
            error: 'uint128',
          },
        },
      },
    },
    {
      name: 'get-last-token-id',
      access: 'read_only',
      args: [],
      outputs: {
        type: {
          response: { ok: 'uint128', error: 'uint128' },
        },
      },
    },
    {
      name: 'get-token-uri',
      access: 'read_only',
      args: [{ name: 'token-id', type: 'uint128' }],
      outputs: {
        type: {
          response: {
            ok: { optional: { 'string-utf8': { length: 256 } } },
            error: 'uint128',
          },
        },
      },
    },
  ],
  variables: [],
  maps: [],
  fungible_tokens: [],
  non_fungible_tokens: [],
};
