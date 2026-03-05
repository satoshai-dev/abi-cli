---
"@satoshai/abi-cli": major
---

Release v1.0.0 — stable CLI and programmatic API for fetching Stacks contract ABIs and generating TypeScript definitions.

### Features
- `fetch` command: fetch ABI from any deployed Stacks contract, output as TypeScript (`as const satisfies ClarityAbi`) or JSON
- `sync` command: config-driven multi-contract ABI syncing with `abi.config.json` or `abi.config.ts`
- `--check` flag: CI staleness detection for both `fetch` and `sync` (exit 1 if stale)
- `name` alias: decouple output filenames from on-chain contract IDs for version-independent imports
- Barrel file generation: auto-generated `index.ts` with camelCase re-exports
- Network support: mainnet, testnet, devnet, and custom Stacks API URLs
- Programmatic API: `fetchContractAbi`, `generateTypescript`, `generateJson`, `loadConfig`, and type re-exports
