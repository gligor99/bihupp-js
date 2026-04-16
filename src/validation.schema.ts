import { z } from "zod";
import {
  ALLOWED_CHARS_REGEX,
  type Address,
  type Amount,
  type PaymentInstructionParams,
} from "./types.js";

const allowedCharsSchema = z
  .string()
  .regex(
    ALLOWED_CHARS_REGEX,
    "Contains invalid characters. Allowed: alphanumeric, Bosnian diacritics (čćđšžČĆĐŠŽ), and , : . ? ( ) + ' / - and space.",
  );

const accountValueSchema = z
  .string()
  .regex(/^\d+$/, "Account must contain only digits.")
  .max(16, "Account must not exceed 16 digits.");

const accountSchema = z.object({
  value: accountValueSchema,
});

const recipientAccountListSchema = z
  .array(accountSchema)
  .min(1, "At least one recipient account is required.")
  .max(20, "Maximum 20 recipient accounts allowed.");

export const nameSchema = z
  .string()
  .max(50, "Name must not exceed 50 characters.")
  .pipe(allowedCharsSchema);

export const addressLine1Schema = z
  .string()
  .max(50, "Address line 1 must not exceed 50 characters.")
  .pipe(allowedCharsSchema);

export const addressLine2Schema = z
  .string()
  .max(25, "Address line 2 must not exceed 25 characters.")
  .pipe(allowedCharsSchema);

const addressSchema: z.ZodType<Address> = z.object({
  addressLine1: z.object({ value: addressLine1Schema }),
  addressLine2: z.object({ value: addressLine2Schema }),
});

const recipientSchema = z.object({
  name: z.object({ value: nameSchema }),
  address: addressSchema,
  account: z.object({
    accounts: recipientAccountListSchema,
  }),
});

const phoneNumberSchema = z.object({
  value: z
    .string()
    .max(15, "Phone number must not exceed 15 characters.")
    .refine((value) => value.startsWith("+"), {
      message: "Phone number must be in E.164 format starting with +.",
    }),
});

const senderSchema = z.object({
  name: z.object({ value: nameSchema }),
  address: addressSchema,
  account: accountSchema,
  phoneNumber: phoneNumberSchema.optional(),
});

export const amountSchema: z.ZodType<Amount> = z.object({
  pennies: z
    .number()
    .int("Amount must be an integer number of pennies.")
    .min(0, "Amount must be non-negative.")
    .refine((value) => value.toString().length <= 15, {
      message: "Amount exceeds maximum of 15 digits.",
    }),
});

export const paymentPurposeSchema = z.object({
  value: allowedCharsSchema.max(
    110,
    "Purpose must not exceed 110 characters.",
  ),
});

export const paymentReferenceSchema = z.object({
  value: allowedCharsSchema.max(
    30,
    "Reference must not exceed 30 characters.",
  ),
});

export const paymentPrioritySchema = z.object({
  code: z.enum(["N", "D"]),
});

const digitsWithExactLength = (length: number, label: string) =>
  z
    .string()
    .regex(/^\d+$/, `${label} must contain only digits.`)
    .refine((value) => value.length === length, {
      message: `${label} must be exactly ${length} digits.`,
    });

export const publicRevenueSchema = z.object({
  senderTaxId: digitsWithExactLength(13, "senderTaxId"),
  paymentType: z
    .string()
    .regex(/^[0-9]$/, "paymentType must be a single digit (0-9)."),
  revenueType: digitsWithExactLength(6, "revenueType"),
  taxPeriodStartDate: z
    .string()
    .regex(
      /^\d{8}$/,
      "taxPeriodStartDate must be in ddMMyyyy format (8 digits).",
    ),
  taxPeriodEndDate: z
    .string()
    .regex(
      /^\d{8}$/,
      "taxPeriodEndDate must be in ddMMyyyy format (8 digits).",
    ),
  municipalCode: digitsWithExactLength(3, "municipalCode"),
  budgetOrgCode: digitsWithExactLength(7, "budgetOrgCode"),
  paymentReference: digitsWithExactLength(10, "paymentReference"),
});

/**
 * Zod schema for validating a complete BIHUPP10 payment instruction
 * structure. This mirrors the rules in `validator.ts` and is intended for
 * callers who want richer, schema-driven validation in addition to the
 * zero-dependency core checks.
 */
export const paymentInstructionParamsSchema = z.object({
  recipient: recipientSchema,
  purpose: paymentPurposeSchema,
  amount: amountSchema,
  sender: z.union([senderSchema, z.null()]).optional(),
  reference: paymentReferenceSchema.nullable().optional(),
  paymentPriority: paymentPrioritySchema.optional(),
  publicRevenue: publicRevenueSchema.nullable().optional(),
});

/**
 * Validates a `PaymentInstructionParams` instance using the Zod schema and
 * returns the parsed value or throws a `ZodError` if validation fails.
 */
export function validatePaymentInstructionWithSchema(
  params: PaymentInstructionParams,
): PaymentInstructionParams {
  // Cast is safe as the schema mirrors `PaymentInstructionParams`
  return paymentInstructionParamsSchema.parse(params) as PaymentInstructionParams;
}

