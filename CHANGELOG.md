## 1.0.0

- Initial BIHUPP10 implementation with:
  - Core `PaymentInstruction` value object and strict field ordering.
  - Parser for BIHUPP10 payload strings.
  - Zero-dependency validation (`validator.ts`).
  - Optional fluent `PaymentInstructionBuilder`.
  - Optional Zod-based schema validation (`validation.schema.ts`).
  - Vitest test suite and TypeScript typings.
