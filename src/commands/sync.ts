import { defineCommand } from 'citty';
import { mkdir, writeFile } from 'node:fs/promises';
import { resolve, join } from 'node:path';
import { loadConfig } from '../config.js';
import { parseContractId, fetchContractAbi } from '../fetcher.js';
import { generateTypescript, generateJson, defaultFilename } from '../codegen.js';

export const syncCommand = defineCommand({
  meta: {
    name: 'sync',
    description: 'Sync ABIs for all contracts defined in a config file',
  },
  args: {
    config: {
      type: 'string',
      alias: 'c',
      description: 'Path to config file (default: abi.config.json or abi.config.ts)',
    },
  },
  async run({ args }) {
    const config = await loadConfig(args.config);
    const format = config.format ?? 'ts';
    const outDir = resolve(config.outDir);

    await mkdir(outDir, { recursive: true });

    const failed: string[] = [];
    let synced = 0;

    for (const contract of config.contracts) {
      const network = contract.network ?? config.network ?? 'mainnet';
      try {
        const { address, name } = parseContractId(contract.id);

        console.error(`Fetching ABI for ${contract.id} on ${network}...`);
        const abi = await fetchContractAbi(network, address, name);

        const output =
          format === 'ts'
            ? generateTypescript(contract.id, abi)
            : generateJson(abi);

        const filename = defaultFilename(contract.id, format, contract.name);
        const filepath = join(outDir, filename);
        await writeFile(filepath, output, 'utf-8');
        console.error(`Wrote ${filepath}`);
        synced++;
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        console.error(`Failed to sync ${contract.id}: ${message}`);
        failed.push(contract.id);
      }
    }

    console.error(`\n${synced}/${config.contracts.length} contracts synced.`);

    if (failed.length > 0) {
      throw new Error(`Failed to sync: ${failed.join(', ')}`);
    }
  },
});
