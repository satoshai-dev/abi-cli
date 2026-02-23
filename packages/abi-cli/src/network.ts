export type NetworkName = 'mainnet' | 'testnet' | 'devnet';

const NETWORK_URLS: Record<NetworkName, string> = {
  mainnet: 'https://api.hiro.so',
  testnet: 'https://api.testnet.hiro.so',
  devnet: 'http://localhost:3999',
};

/**
 * Resolve a network name or custom URL to a Stacks API base URL.
 * Accepts 'mainnet', 'testnet', 'devnet', or a full URL.
 */
export function resolveNetwork(network: string): string {
  if (network in NETWORK_URLS) {
    return NETWORK_URLS[network as NetworkName];
  }

  try {
    new URL(network);
    return network.replace(/\/+$/, '');
  } catch {
    throw new Error(
      `Invalid network "${network}". Use mainnet, testnet, devnet, or a valid URL.`,
    );
  }
}
