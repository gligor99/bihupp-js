# Contributing to bihupp-js

Thanks for your interest in contributing! Bug reports, fixes and improvements are all welcome.

## Reporting issues

- **Bugs and feature requests:** open an [issue](https://github.com/gligor99/bihupp-js/issues/new/choose) using one of the templates.
- **Security vulnerabilities:** do not open a public issue — see [SECURITY.md](SECURITY.md).
- Never paste real account numbers, tax IDs or other personal data. Use placeholder values.

## Development setup

Requires Node.js 18 or newer.

```bash
git clone https://github.com/gligor99/bihupp-js.git
cd bihupp-js
npm install
```

| Command             | Description                                   |
| ------------------- | --------------------------------------------- |
| `npm test`          | Run tests in watch mode                       |
| `npm run test:run`  | Run tests once                                |
| `npm run typecheck` | Type-check the project                        |
| `npm run build`     | Build `dist/` with tsup                       |
| `npm run lint:pkg`  | Check package exports (publint + attw)        |

## Project structure

```
src/
  index.ts              core entry point (zero dependencies)
  zod.ts                optional `bihupp-js/zod` entry point
  builder.ts            PaymentInstruction + fluent builder
  parser.ts             BIHUPP10 string parser
  validator.ts          zero-dependency validation
  validation.schema.ts  Zod schemas
  types.ts              types, value objects, constants
tests/
  index.test.ts
```

The core entry point must stay dependency-free. Anything that needs `zod` belongs in `validation.schema.ts` / `zod.ts`. When you change a validation rule, update both `validator.ts` and `validation.schema.ts` so they stay in sync.

## Pull requests

1. Fork the repo and create a branch from `main`.
2. Make your change and add tests.
3. Make sure `npm run typecheck` and `npm run test:run` pass.
4. Update `README.md` if the public API changed, and add an entry to `CHANGELOG.md`.
5. Open a pull request with a short description of what and why.

Commit messages follow [Conventional Commits](https://www.conventionalcommits.org/) (`feat:`, `fix:`, `docs:`, `chore:` …).

## Releases

Releases are published to npm by the maintainer from GitHub Actions when a `v*` tag is pushed.

## Code of conduct

This project follows the [Code of Conduct](CODE_OF_CONDUCT.md). By participating you agree to uphold it.
