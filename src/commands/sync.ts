import { defineCommand } from 'citty';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { resolve, join } from 'node:path';
import { loadConfig } from '../config.js';
import { parseContractId, fetchContractAbi } from '../fetcher.js';
import { generateTypescript, generateJson, defaultFilename, generateBarrel } from '../codegen.js';

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
    check: {
      type: 'boolean',
      description: 'Check if local files are up-to-date with on-chain ABIs (exit 1 if stale)',
      default: false,
    },
  },
  async run({ args }) {
    const config = await loadConfig(args.config);
    const format = config.format ?? 'ts';
    const outDir = resolve(config.outDir);

    await mkdir(outDir, { recursive: true });

    const failed: string[] = [];
    const stale: string[] = [];
    const barrelEntries: { name: string; filename: string }[] = [];
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

        const resolvedName = contract.name ?? name;
        const filename = defaultFilename(contract.id, format, contract.name);
        const filepath = join(outDir, filename);

        if (args.check) {
          try {
            const existing = await readFile(filepath, 'utf-8');
            if (existing !== output) {
              console.error(`Stale: ${filepath}`);
              stale.push(filepath);
            }
          } catch (err) {
            if ((err as NodeJS.ErrnoException).code === 'ENOENT') {
              console.error(`Missing: ${filepath}`);
              stale.push(filepath);
            } else {
              throw err;
            }
          }
        } else {
          await writeFile(filepath, output, 'utf-8');
          console.error(`Wrote ${filepath}`);
        }
        synced++;
        barrelEntries.push({ name: resolvedName, filename });
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        console.error(`Failed to sync ${contract.id}: ${message}`);
        failed.push(contract.id);
      }
    }

    if (!args.check && format === 'ts' && barrelEntries.length > 0) {
      const barrelContent = generateBarrel(barrelEntries);
      const barrelPath = join(outDir, 'index.ts');
      await writeFile(barrelPath, barrelContent, 'utf-8');
      console.error(`Wrote ${barrelPath}`);
    }

    if (args.check) {
      console.error(`\n${synced}/${config.contracts.length} contracts checked.`);
      if (stale.length > 0) {
        process.exitCode = 1;
      }
    } else {
      console.error(`\n${synced}/${config.contracts.length} contracts synced.`);
    }

    if (failed.length > 0) {
      throw new Error(`Failed to sync: ${failed.join(', ')}`);
    }
  },
});
