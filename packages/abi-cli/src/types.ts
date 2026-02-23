/**
 * Local ClarityAbi types mirroring @stacks/transactions contract-abi.ts.
 * Defined locally to avoid a runtime dependency on @stacks/transactions.
 */

export type ClarityAbiTypeBuffer = { buffer: { length: number } };
export type ClarityAbiTypeStringAscii = { 'string-ascii': { length: number } };
export type ClarityAbiTypeStringUtf8 = { 'string-utf8': { length: number } };
export type ClarityAbiTypeResponse = {
  response: { ok: ClarityAbiType; error: ClarityAbiType };
};
export type ClarityAbiTypeOptional = { optional: ClarityAbiType };
export type ClarityAbiTypeTuple = {
  tuple: readonly { name: string; type: ClarityAbiType }[];
};
export type ClarityAbiTypeList = {
  list: { type: ClarityAbiType; length: number };
};

export type ClarityAbiTypePrimitive =
  | 'int128'
  | 'uint128'
  | 'bool'
  | 'principal'
  | 'none'
  | 'trait_reference';

export type ClarityAbiType =
  | ClarityAbiTypePrimitive
  | ClarityAbiTypeBuffer
  | ClarityAbiTypeStringAscii
  | ClarityAbiTypeStringUtf8
  | ClarityAbiTypeResponse
  | ClarityAbiTypeOptional
  | ClarityAbiTypeTuple
  | ClarityAbiTypeList;

export type ClarityAbiFunction = {
  name: string;
  access: 'private' | 'public' | 'read_only';
  args: readonly { name: string; type: ClarityAbiType }[];
  outputs: { type: ClarityAbiType };
};

export type ClarityAbiVariable = {
  name: string;
  access: 'variable' | 'constant';
  type: ClarityAbiType;
};

export type ClarityAbiMap = {
  name: string;
  key: ClarityAbiType;
  value: ClarityAbiType;
};

export type ClarityAbiFungibleToken = {
  name: string;
};

export type ClarityAbiNonFungibleToken = {
  name: string;
  type: ClarityAbiType;
};

export interface ClarityAbi {
  functions: readonly ClarityAbiFunction[];
  variables: readonly ClarityAbiVariable[];
  maps: readonly ClarityAbiMap[];
  fungible_tokens: readonly ClarityAbiFungibleToken[];
  non_fungible_tokens: readonly ClarityAbiNonFungibleToken[];
  epoch: string;
  clarity_version: string;
}
