## Unreleased

- **Breaking:** require Node.js 22 or newer (Node 18 and 20 are end-of-life).
- Bump dev tooling to vitest 5 and tsup 9.

## 1.0.0

- Initial BIHUPP10 implementation with:
  - Core `PaymentInstruction` value object and strict field ordering.
  - Parser for BIHUPP10 payload strings.
  - Zero-dependency validation (`validator.ts`).
  - Optional fluent `PaymentInstructionBuilder`.
  - Optional Zod v4 schema validation via the `bihupp-js/zod` entry point (`zod` is an optional peer dependency).
  - Vitest test suite and TypeScript typings.
