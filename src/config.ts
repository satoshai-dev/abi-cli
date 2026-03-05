import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { parseContractId } from './fetcher.js';
import { resolveNetwork } from './network.js';

export interface ContractEntry {
  id: string;
  name?: string;
  network?: string;
}

export interface AbiConfig {
  outDir: string;
  format?: 'ts' | 'json';
  network?: string;
  contracts: ContractEntry[];
}

export function validateConfig(raw: unknown): AbiConfig {
  if (typeof raw !== 'object' || raw === null || Array.isArray(raw)) {
    throw new Error('Config must be an object.');
  }

  const obj = raw as Record<string, unknown>;

  if (typeof obj.outDir !== 'string' || !obj.outDir) {
    throw new Error('Config "outDir" is required and must be a non-empty string.');
  }

  if (obj.format !== undefined) {
    if (obj.format !== 'ts' && obj.format !== 'json') {
      throw new Error(`Invalid config "format": "${obj.format}". Use "ts" or "json".`);
    }
  }

  if (obj.network !== undefined) {
    if (typeof obj.network !== 'string') {
      throw new Error('Config "network" must be a string.');
    }
    resolveNetwork(obj.network);
  }

  if (!Array.isArray(obj.contracts) || obj.contracts.length === 0) {
    throw new Error('Config "contracts" is required and must be a non-empty array.');
  }

  for (const entry of obj.contracts) {
    if (typeof entry !== 'object' || entry === null || Array.isArray(entry)) {
      throw new Error('Each contract entry must be an object.');
    }
    const e = entry as Record<string, unknown>;
    if (typeof e.id !== 'string' || !e.id) {
      throw new Error('Each contract entry must have an "id" string.');
    }
    parseContractId(e.id);
    if (e.name !== undefined) {
      if (typeof e.name !== 'string' || !e.name) {
        throw new Error(`Contract "${e.id}" has an invalid "name" value. Must be a non-empty string.`);
      }
    }
    if (e.network !== undefined) {
      if (typeof e.network !== 'string') {
        throw new Error(`Contract "${e.id}" has an invalid "network" value.`);
      }
      resolveNetwork(e.network);
    }
  }

  const contracts = (obj.contracts as Record<string, unknown>[]).map((c) => ({
    id: c.id as string,
    ...(c.name !== undefined ? { name: c.name as string } : {}),
    ...(c.network !== undefined ? { network: c.network as string } : {}),
  }));

  // Check for duplicate resolved names (name or contract name from ID)
  const seen = new Set<string>();
  for (const c of contracts) {
    const resolved = c.name ?? c.id.split('.').pop()!;
    if (seen.has(resolved)) {
      throw new Error(`Duplicate contract name "${resolved}". Use the "name" field to disambiguate.`);
    }
    seen.add(resolved);
  }

  return {
    outDir: obj.outDir,
    format: obj.format as AbiConfig['format'],
    network: obj.network as string | undefined,
    contracts,
  };
}

const DEFAULT_CONFIG_FILES = ['abi.config.json', 'abi.config.ts'];

export async function loadConfig(configPath?: string): Promise<AbiConfig> {
  if (configPath) {
    const absolute = resolve(configPath);
    return loadFile(absolute);
  }

  for (const filename of DEFAULT_CONFIG_FILES) {
    const absolute = resolve(filename);
    try {
      return await loadFile(absolute);
    } catch (err) {
      if (isFileNotFound(err)) continue;
      throw err;
    }
  }

  throw new Error(
    `No config file found. Create abi.config.json or abi.config.ts in the current directory, or pass --config.`,
  );
}

async function loadFile(filepath: string): Promise<AbiConfig> {
  let raw: unknown;

  if (filepath.endsWith('.ts')) {
    const { default: jiti } = await import('jiti');
    const loader = jiti(filepath, { interopDefault: true });
    raw = await loader.import(filepath, { default: true });
  } else {
    const content = await readFile(filepath, 'utf-8');
    try {
      raw = JSON.parse(content);
    } catch {
      throw new Error(`Failed to parse JSON config at ${filepath}.`);
    }
  }

  return validateConfig(raw);
}

function isFileNotFound(err: unknown): boolean {
  return (
    err instanceof Error &&
    'code' in err &&
    (err as NodeJS.ErrnoException).code === 'ENOENT'
  );
}
