import { defineCommand, runMain } from 'citty';
import { fetchCommand } from './commands/fetch.js';

declare const __VERSION__: string;

const main = defineCommand({
  meta: {
    name: 'abi-cli',
    version: __VERSION__,
    description: 'Fetch Stacks contract ABIs and generate TypeScript definitions',
  },
  subCommands: {
    fetch: fetchCommand,
  },
});

runMain(main);
