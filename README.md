# @satoshai/abi-cli

CLI tool to fetch ABIs from deployed Stacks blockchain contracts and output TypeScript-ready definitions (`as const`).

## Install

```bash
npm install -g @satoshai/abi-cli
```

## Usage

```bash
# Fetch ABI and write TypeScript file
abi-cli fetch SP2PABAF9FTAJYNFZH93XENAJ8FVY99RRM50D2JG9.nft-trait

# Output to stdout
abi-cli fetch SP2PABAF9FTAJYNFZH93XENAJ8FVY99RRM50D2JG9.nft-trait --stdout

# JSON format
abi-cli fetch SP2PABAF9FTAJYNFZH93XENAJ8FVY99RRM50D2JG9.nft-trait --format json

# Custom output path
abi-cli fetch SP2PABAF9FTAJYNFZH93XENAJ8FVY99RRM50D2JG9.nft-trait -o ./abis/nft-trait.ts

# Testnet
abi-cli fetch ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.my-contract -n testnet

# Multiple contracts
abi-cli fetch SP...contract1,SP...contract2
```

## Programmatic API

```typescript
import { fetchContractAbi, generateTypescript } from '@satoshai/abi-cli';

const abi = await fetchContractAbi('mainnet', 'SP2PABAF9FTAJYNFZH93XENAJ8FVY99RRM50D2JG9', 'nft-trait');
const code = generateTypescript('SP2PABAF9FTAJYNFZH93XENAJ8FVY99RRM50D2JG9.nft-trait', abi);
```

## License

MIT
