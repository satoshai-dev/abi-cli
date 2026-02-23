# Contributing to @satoshai/abi-cli

## Development

```bash
pnpm install
pnpm build
pnpm test
```

## Commit Convention

This project uses [Conventional Commits](https://www.conventionalcommits.org/).

```
feat: add new feature
fix: fix a bug
docs: documentation changes
chore: maintenance tasks
```

## Releasing

This project uses [Changesets](https://github.com/changesets/changesets) for versioning.

1. Run `pnpm changeset` to create a changeset
2. Commit and push
3. The release workflow will create a release PR or publish automatically
