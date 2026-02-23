import { defineCommand } from 'citty';
import { parseContractId, fetchContractAbi } from '../fetcher.js';
import { generateTypescript, generateJson, defaultFilename } from '../codegen.js';
import { writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';

export const fetchCommand = defineCommand({
  meta: {
    name: 'fetch',
    description: 'Fetch ABI from a deployed Stacks contract',
  },
  args: {
    contract: {
      type: 'positional',
      description: 'Contract ID(s) in <address>.<name> format (comma-separated for multiple)',
      required: true,
    },
    network: {
      type: 'string',
      alias: 'n',
      description: 'Network: mainnet, testnet, devnet, or a custom URL',
      default: 'mainnet',
    },
    output: {
      type: 'string',
      alias: 'o',
      description: 'Output file path (only for single contract)',
    },
    format: {
      type: 'string',
      alias: 'f',
      description: 'Output format: ts or json',
      default: 'ts',
    },
    stdout: {
      type: 'boolean',
      description: 'Print output to stdout instead of writing a file',
      default: false,
    },
  },
  async run({ args }) {
    const format = args.format as 'ts' | 'json';
    if (format !== 'ts' && format !== 'json') {
      throw new Error(`Invalid format "${format}". Use "ts" or "json".`);
    }

    const contractIds = args.contract.split(',').map((s) => s.trim());

    for (const contractId of contractIds) {
      const { address, name } = parseContractId(contractId);

      console.error(`Fetching ABI for ${contractId} on ${args.network}...`);
      const abi = await fetchContractAbi(args.network, address, name);

      const output =
        format === 'ts'
          ? generateTypescript(contractId, abi)
          : generateJson(abi);

      if (args.stdout) {
        process.stdout.write(output);
      } else {
        const filename = args.output ?? defaultFilename(contractId, format);
        const filepath = resolve(filename);
        await writeFile(filepath, output, 'utf-8');
        console.error(`Wrote ${filepath}`);
      }
    }
  },
});
