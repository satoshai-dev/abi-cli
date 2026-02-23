import { createRequire } from 'node:module';
import { defineCommand, runMain } from 'citty';
import { fetchCommand } from './commands/fetch.js';

const require = createRequire(import.meta.url);
const { version } = require('../package.json') as { version: string };

const main = defineCommand({
  meta: {
    name: 'abi-cli',
    version,
    description: 'Fetch Stacks contract ABIs and generate TypeScript definitions',
  },
  subCommands: {
    fetch: fetchCommand,
  },
});

runMain(main);
