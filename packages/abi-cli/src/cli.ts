import { defineCommand, runMain } from 'citty';
import { fetchCommand } from './commands/fetch.js';

const main = defineCommand({
  meta: {
    name: 'abi-cli',
    version: '0.1.0',
    description: 'Fetch Stacks contract ABIs and generate TypeScript definitions',
  },
  subCommands: {
    fetch: fetchCommand,
  },
});

runMain(main);
