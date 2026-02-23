import type { ClarityAbi } from '@stacks/transactions';
import { resolveNetwork } from './network.js';

export interface ContractId {
  address: string;
  name: string;
}

/**
 * Parse a fully qualified contract ID (e.g. "SP2PABAF9FTAJYNFZH93XENAJ8FVY99RRM50D2JG9.nft-trait")
 * into its address and name parts.
 */
export function parseContractId(contractId: string): ContractId {
  const parts = contractId.split('.');
  if (parts.length !== 2 || !parts[0] || !parts[1]) {
    throw new Error(
      `Invalid contract ID "${contractId}". Expected format: <address>.<name>`,
    );
  }
  return { address: parts[0], name: parts[1] };
}

/**
 * Fetch the ABI for a deployed Stacks contract.
 */
export async function fetchContractAbi(
  network: string,
  address: string,
  name: string,
): Promise<ClarityAbi> {
  const baseUrl = resolveNetwork(network);
  const url = `${baseUrl}/v2/contracts/interface/${address}/${name}`;

  const response = await fetch(url);

  if (!response.ok) {
    if (response.status === 404) {
      throw new Error(
        `Contract not found: ${address}.${name} on ${network}`,
      );
    }
    throw new Error(
      `Failed to fetch ABI for ${address}.${name}: ${response.status} ${response.statusText}`,
    );
  }

  return (await response.json()) as ClarityAbi;
}
