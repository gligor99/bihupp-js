import {
  Amount,
  AddressLine1,
  AddressLine2,
  Name,
  PaymentPriority,
  PhoneNumber,
  PaymentPurpose,
  RecipientAccount,
  type Account,
  type ParseResult,
  type PaymentInstructionParams,
  type PublicRevenueInstruction,
  type Recipient,
  type Sender,
} from "./types.js";
import { validatePaymentInstruction } from "./validator.js";

// Helpers

function parseAccounts(raw: string): Account[] {
  return raw.split(",").map((v) => ({ value: v.trim() }));
}

function parsePriority(raw: string) {
  // Saša-b reference: 'D' => urgent, everything else defaults to regular.
  if (raw === "D") return PaymentPriority.urgent();
  return PaymentPriority.regular();
}

// Public API

/**
 * Parses a raw BIHUPP10 payload string (as decoded from a QR code)
 * back into a structured PaymentInstructionParams object.
 *
 * @example
 * ```ts
 * const result = parsePaymentInstruction(rawString);
 * if (result.success) {
 *   console.log(result.instruction.recipient.name.value);
 * } else {
 *   console.error(result.error.message);
 * }
 * ```
 */

export function parsePaymentInstruction(raw: string): ParseResult {
  try {
    // Parse up to 23 lines; missing lines are treated as empty.
    // This mirrors Saša-b behavior (always works with a 23-line view).
    const rawLines = raw.split("\n");
    const lines = Array.from({ length: 23 }, (_, i) => rawLines[i] ?? "");

    // Line order:
    //  0  BIHUPP10
    //  1  sender name
    //  2  sender addressLine1
    //  3  sender addressLine2
    //  4  sender phone
    //  5  purpose
    //  6  reference
    //  7  recipient name
    //  8  recipient addressLine1
    //  9  recipient addressLine2
    //  10 sender account
    //  11 recipient account(s)
    //  12 amount
    //  13 currency
    //  14 priority
    //  15-22 publicRevenue fields

    const senderName = lines[1] ?? "";
    const purpose = PaymentPurpose.of(lines[5] ?? "");
    const referenceRaw = lines[6] ?? "";
    const reference = referenceRaw ? { value: referenceRaw } : null;

    const recipient: Recipient = {
      name: Name.of(lines[7] ?? ""),
      address: {
        addressLine1: AddressLine1.raw(lines[8] ?? ""),
        addressLine2: AddressLine2.raw(lines[9] ?? ""),
      },
      account: RecipientAccount.fromList(parseAccounts(lines[11] ?? "")),
    };

    const rawAmount = (lines[12] ?? "").replace(/^0+/, "") || "0";
    const amount = Amount.fromPennies(parseInt(rawAmount, 10));
    const priority = parsePriority((lines[14] ?? "N").trim());

    let sender: Sender | null = null;
    if (senderName.trim() !== "") {
      const phoneRaw = (lines[4] ?? "").trim();
      sender = {
        name: Name.of(senderName),
        address: {
          addressLine1: AddressLine1.raw(lines[2] ?? ""),
          addressLine2: AddressLine2.raw(lines[3] ?? ""),
        },
        account: { value: lines[10] ?? "" },
        ...(phoneRaw !== "" && { phoneNumber: PhoneNumber.of(phoneRaw) }),
      };
    }

    // Public revenue block (lines 15–22) — present only when at least one field is non-empty
    let publicRevenue: PublicRevenueInstruction | null = null;
    const prRaw = [
      lines[15] ?? "",
      lines[16] ?? "",
      lines[17] ?? "",
      lines[18] ?? "",
      lines[19] ?? "",
      lines[20] ?? "",
      lines[21] ?? "",
      lines[22] ?? "",
    ];
    const hasPublicRevenue = prRaw.some((v) => v.trim() !== "");
    if (hasPublicRevenue) {
      publicRevenue = {
        senderTaxId: lines[15] ?? "",
        paymentType: lines[16] ?? "",
        revenueType: lines[17] ?? "",
        taxPeriodStartDate: lines[18] ?? "",
        taxPeriodEndDate: lines[19] ?? "",
        municipalCode: lines[20] ?? "",
        budgetOrgCode: lines[21] ?? "",
        paymentReference: lines[22] ?? "",
      };
    }

    const instruction: PaymentInstructionParams = {
      recipient,
      amount,
      purpose,
      reference,
      sender,
      paymentPriority: priority,
      publicRevenue,
    };

    // Enforce the same validation rules as the builder/constructor.
    validatePaymentInstruction(instruction);

    return { success: true, instruction, rawPayload: raw };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err : new Error(String(err)),
      rawPayload: raw,
    };
  }
}
