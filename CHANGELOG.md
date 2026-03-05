# @satoshai/abi-cli

## 1.0.0

### Major Changes

- 2a1e694: Release v1.0.0 — stable CLI and programmatic API for fetching Stacks contract ABIs and generating TypeScript definitions.

  ### Features

  - `fetch` command: fetch ABI from any deployed Stacks contract, output as TypeScript (`as const satisfies ClarityAbi`) or JSON
  - `sync` command: config-driven multi-contract ABI syncing with `abi.config.json` or `abi.config.ts`
  - `--check` flag: CI staleness detection for both `fetch` and `sync` (exit 1 if stale)
  - `name` alias: decouple output filenames from on-chain contract IDs for version-independent imports
  - Barrel file generation: auto-generated `index.ts` with camelCase re-exports
  - Network support: mainnet, testnet, devnet, and custom Stacks API URLs
  - Programmatic API: `fetchContractAbi`, `generateTypescript`, `generateJson`, `loadConfig`, and type re-exports

## 0.5.0

### Minor Changes

- 8b94d68: Generate barrel `index.ts` file when syncing multiple contracts
- 9f0976c: Add `--check` flag to `fetch` and `sync` commands for CI staleness detection
- 7f7c443: Add optional `name` field to contract config entries for aliasing output filenames

### Patch Changes

- 1b5d222: Fix jiti MODULE_NOT_FOUND error when running sync without a config file

## 0.4.0

### Minor Changes

- 18ef6e3: Generated TypeScript now includes `satisfies ClarityAbi` for compile-time shape checking and exports a named `Abi` type alias

### Patch Changes

- ca81d29: Add runtime validation on API response shape before `as ClarityAbi` cast

## 0.3.0

### Minor Changes

- 3d24056: Add `sync` command for config-driven multi-contract ABI syncing. Supports `abi.config.json` and `abi.config.ts` config files with per-contract network overrides, partial failure handling, and a summary report. Exports `loadConfig`, `validateConfig`, `AbiConfig`, and `ContractEntry` from the programmatic API.

## 0.2.1

### Patch Changes

- 96f7f3b: Clean up redundant package.json fields, remove duplicate test:unit script, add explicit dts: false to CLI tsup entry
- 0b65d07: Add CLI validation for --output/--stdout with multiple contracts and improve fetch error messages
- b2d9b90: Inline version at build time via tsup define instead of runtime createRequire
- e87b275: Fix lint script to use eslint directory input instead of fragile shell glob
- bb97e45: Make @stacks/transactions a required (non-optional) peer dependency
- 01f5efd: Improve test coverage and fix typecheck to include test files
- d79423b: Validate network parameter before fetch loop for fail-fast behavior
- b2a03f9: Add comprehensive test coverage for fetch command (--stdout, --output, file writing, validation)

## 0.2.0

### Minor Changes

- Initial release: CLI and programmatic API to fetch Stacks contract ABIs and generate TypeScript definitions.

## Changelog
