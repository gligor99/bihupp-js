export { PaymentInstruction, PaymentInstructionBuilder } from "./builder.js";
export { parsePaymentInstruction } from "./parser.js";
export { validatePaymentInstruction } from "./validator.js";
export {
  paymentInstructionParamsSchema,
  validatePaymentInstructionWithSchema,
} from "./validation.schema.js";

// Types & helpers
export {
  // Constants
  BIHUPP_VERSION,
  BIHUPP_CURRENCY,
  ALLOWED_CHARS_REGEX,

  // Value object factories
  Name,
  AddressLine1,
  AddressLine2,
  Amount,
  PaymentPurpose,
  PaymentPriority,
  PhoneNumber,
  RecipientAccount,

  // Error
  BihuppValidationError,
} from "./types.js";

// TypeScript interfaces
export type {
  PaymentInstructionParams,
  Recipient,
  Sender,
  Address,
  Account,
  Name as NameType,
  AddressLine1 as AddressLine1Type,
  AddressLine2 as AddressLine2Type,
  Amount as AmountType,
  PaymentPurpose as PaymentPurposeType,
  PaymentPriority as PaymentPriorityType,
  PaymentPriorityCode,
  PaymentReference,
  PhoneNumber as PhoneNumberType,
  RecipientAccount as RecipientAccountType,
  PublicRevenueInstruction,
  ParseResult,
} from "./types.js";
