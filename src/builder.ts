import {
  BIHUPP_CURRENCY,
  BIHUPP_VERSION,
  PaymentPriority,
  type PaymentInstructionParams,
  type Recipient,
  type Sender,
  type Amount,
  type PaymentPurpose,
  type PaymentReference,
  type PublicRevenueInstruction,
} from "./types.js";
import { validatePaymentInstruction } from "./validator.js";

function formatAmount(pennies: number): string {
  return pennies.toString().padStart(15, "0");
}

function formatRecipientAccounts(accounts: { value: string }[]): string {
  return accounts.map((a) => a.value).join(",");
}

/**
 * Core BIHUPP10 payment instruction value object.
 *
 * This class is intentionally simple and immutable. For a more ergonomic API,
 * prefer using {@link PaymentInstructionBuilder} which guides you through
 * constructing a valid instruction while preserving field ordering.
 */
export class PaymentInstruction {
  readonly #params: PaymentInstructionParams;

  constructor(params: PaymentInstructionParams) {
    validatePaymentInstruction(params);
    this.#params = params;
  }

  /**
   * Returns the BIHUPP10 payload string representation, with fields ordered
   * exactly as required by the specification.
   */
  toString(): string {
    return this.lines().join("\n");
  }

  /**
   * Returns the BIHUPP10 payload as an array of lines, in the exact order
   * defined by the BIHUPP10 standard.
   */
  lines(): string[] {
    const p = this.#params;
    const priority = p.paymentPriority ?? PaymentPriority.regular();

    const lines: string[] = [
      BIHUPP_VERSION, // 0
      p.sender?.name.value ?? "", // 1
      p.sender?.address.addressLine1.value ?? "", // 2
      p.sender?.address.addressLine2.value ?? "", // 3
      p.sender?.phoneNumber?.value ?? "", // 4
      p.purpose.value, // 5
      p.reference?.value ?? "", // 6
      p.recipient.name.value, // 7
      p.recipient.address.addressLine1.value, // 8
      p.recipient.address.addressLine2.value, // 9
      p.sender?.account.value ?? "", // 10
      formatRecipientAccounts(p.recipient.account.accounts), // 11
      formatAmount(p.amount.pennies), // 12
      BIHUPP_CURRENCY, // 13
      priority.code, // 14
    ];

    // Saša-b reference implementation always includes the public revenue block
    // (lines 15–22), using empty lines when not applicable.
    const pr = p.publicRevenue;
    lines.push(
      pr?.senderTaxId ?? "",
      pr?.paymentType ?? "",
      pr?.revenueType ?? "",
      pr?.taxPeriodStartDate ?? "",
      pr?.taxPeriodEndDate ?? "",
      pr?.municipalCode ?? "",
      pr?.budgetOrgCode ?? "",
      pr?.paymentReference ?? "",
    );

    return lines;
  }

  /**
   * Returns a human-readable multi-line string representation of the
   * instruction, useful for logging and debugging.
   */
  inspect(): string {
    const p = this.#params;
    const bam = (p.amount.pennies / 100).toFixed(2);
    return [
      `BIHUPP10 Payment Instruction`,
      `  Recipient : ${p.recipient.name.value}`,
      `  Account   : ${formatRecipientAccounts(p.recipient.account.accounts)}`,
      `  Amount    : ${bam} BAM`,
      `  Purpose   : ${p.purpose.value}`,
      `  Reference : ${p.reference?.value ?? "—"}`,
      `  Sender    : ${p.sender?.name.value ?? "(bank auto-fill)"}`,
      `  Priority  : ${(p.paymentPriority ?? PaymentPriority.regular()).code === "N" ? "Regular" : "Urgent"}`,
    ].join("\n");
  }

  /**
   * Returns the underlying structured parameters used to construct this
   * instruction. The returned object is read-only.
   */
  get params(): Readonly<PaymentInstructionParams> {
    return this.#params;
  }
}

/**
 * Fluent builder for constructing BIHUPP10 payment instructions while
 * preserving field ordering and applying validation once at build time.
 *
 * The builder is a thin ergonomic layer over {@link PaymentInstruction}.
 */
export class PaymentInstructionBuilder {
  #recipient: Recipient | null = null;
  #amount: Amount | null = null;
  #purpose: PaymentPurpose | null = null;
  #sender: Sender | null | undefined;
  #reference: PaymentReference | null | undefined;
  #paymentPriority: PaymentPriority | undefined;
  #publicRevenue: PublicRevenueInstruction | null | undefined;

  /**
   * Creates a new builder instance.
   */
  static create(): PaymentInstructionBuilder {
    return new PaymentInstructionBuilder();
  }

  /**
   * Sets the recipient block (name, address, account).
   */
  withRecipient(recipient: Recipient): this {
    this.#recipient = recipient;
    return this;
  }

  /**
   * Sets the payment amount.
   */
  withAmount(amount: Amount): this {
    this.#amount = amount;
    return this;
  }

  /**
   * Sets the payment purpose.
   */
  withPurpose(purpose: PaymentPurpose): this {
    this.#purpose = purpose;
    return this;
  }

  /**
   * Sets the optional sender block. When `sender` is `null`, the sender
   * section in the payload is left empty so that the bank can auto-fill it.
   */
  withSender(sender: Sender | null): this {
    this.#sender = sender;
    return this;
  }

  /**
   * Sets the optional payment reference (e.g. invoice number).
   */
  withReference(reference: PaymentReference | null): this {
    this.#reference = reference;
    return this;
  }

  /**
   * Sets the payment priority. If omitted, `regular()` is assumed.
   */
  withPaymentPriority(priority: PaymentPriority): this {
    this.#paymentPriority = priority;
    return this;
  }

  /**
   * Sets the optional public revenue block (taxes, fees, etc.).
   */
  withPublicRevenue(publicRevenue: PublicRevenueInstruction | null): this {
    this.#publicRevenue = publicRevenue;
    return this;
  }

  /**
   * Builds a validated {@link PaymentInstruction} instance.
   *
   * This method performs a final check that all required fields are present
   * before delegating to {@link PaymentInstruction}, which runs the full
   * BIHUPP10 validation.
   */
  build(): PaymentInstruction {
    if (!this.#recipient) {
      throw new Error("recipient is required");
    }
    if (!this.#amount) {
      throw new Error("amount is required");
    }
    if (!this.#purpose) {
      throw new Error("purpose is required");
    }

    const baseParams: PaymentInstructionParams = {
      recipient: this.#recipient,
      amount: this.#amount,
      purpose: this.#purpose,
      sender: this.#sender ?? null,
      reference: this.#reference ?? null,
      publicRevenue: this.#publicRevenue ?? null,
    };

    if (this.#paymentPriority) {
      baseParams.paymentPriority = this.#paymentPriority;
    }

    return new PaymentInstruction(baseParams);
  }
}

