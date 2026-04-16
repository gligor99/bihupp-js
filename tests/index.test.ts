import { describe, it, expect } from "vitest";
import {
  PaymentInstruction,
  PaymentInstructionBuilder,
  parsePaymentInstruction,
  Name,
  AddressLine1,
  AddressLine2,
  Amount,
  PaymentPurpose,
  PaymentPriority,
  RecipientAccount,
  PhoneNumber,
  BihuppValidationError,
  validatePaymentInstructionWithSchema,
} from "../src/index.js";

// Fixtures

const recipient = {
  name: Name.business("Vodovod d.o.o."),
  address: {
    addressLine1: AddressLine1.of("Kralja Petra I Karađorđevića", "97"),
    addressLine2: AddressLine2.of("78000", "Banja Luka"),
  },
  account: RecipientAccount.of({ value: "9876543210987654" }),
};

const sender = {
  name: Name.individual("Marko", "Marković"),
  address: {
    addressLine1: AddressLine1.of("Ulica Meše Selimovića", "12"),
    addressLine2: AddressLine2.of("78000", "Banja Luka"),
  },
  account: { value: "1234567890123456" },
};

// Builder
// Payload line order (BIHUPP10 spec):
//  0  BIHUPP10
//  1  sender name (empty if null)
//  2  sender address line 1
//  3  sender address line 2
//  4  sender phone (empty if null)
//  5  purpose
//  6  reference (empty if null)
//  7  recipient name
//  8  recipient address line 1
//  9  recipient address line 2
//  10 sender account (empty if null)
//  11 recipient account(s)
//  12 amount (zero-padded 15 digits)
//  13 currency (BAM)
//  14 priority (N/D)

describe("PaymentInstruction", () => {
  it("builds a valid payload string", () => {
    const instruction = new PaymentInstruction({
      recipient,
      amount: Amount.fromPennies(9862),
      purpose: PaymentPurpose.of("Račun za vodu - april 2025"),
      reference: { value: "1234-5678-001" },
      sender,
    });

    const lines = instruction.toString().split("\n");

    expect(lines[0]).toBe("BIHUPP10");
    expect(lines[1]).toBe("Marko Marković");
    expect(lines[4]).toBe("");
    expect(lines[5]).toBe("Račun za vodu - april 2025");
    expect(lines[6]).toBe("1234-5678-001");
    expect(lines[7]).toBe("Vodovod d.o.o.");
    expect(lines[10]).toBe("1234567890123456");
    expect(lines[11]).toBe("9876543210987654");
    expect(lines[12]).toBe("000000000009862");
    expect(lines[13]).toBe("BAM");
    expect(lines[14]).toBe("N");
    expect(lines).toHaveLength(23);
    expect(lines.slice(15)).toEqual(["", "", "", "", "", "", "", ""]);
  });

  it("handles null sender with empty block", () => {
    const instruction = new PaymentInstruction({
      recipient,
      amount: Amount.fromBAM(98.62),
      purpose: PaymentPurpose.of("Test"),
      sender: null,
    });

    const lines = instruction.lines();
    expect(lines[1]).toBe("");
    expect(lines[2]).toBe("");
    expect(lines[3]).toBe("");
    expect(lines[4]).toBe("");
    expect(lines[10]).toBe("");
    expect(lines).toHaveLength(23);
  });

  it("handles urgent payment priority", () => {
    const instruction = new PaymentInstruction({
      recipient,
      amount: Amount.fromPennies(10000),
      purpose: PaymentPurpose.of("Urgent payment"),
      paymentPriority: PaymentPriority.urgent(),
    });

    const lines = instruction.lines();
    expect(lines[14]).toBe("D");
    expect(lines).toHaveLength(23);
  });

  it("handles multiple recipient accounts", () => {
    const instruction = new PaymentInstruction({
      recipient: {
        ...recipient,
        account: RecipientAccount.of(
          { value: "1234567890123456" },
          { value: "9876543210987654" },
        ),
      },
      amount: Amount.fromPennies(10000),
      purpose: PaymentPurpose.of("Test"),
    });

    expect(instruction.lines()[11]).toBe("1234567890123456,9876543210987654");
  });

  it("normalizes newlines in purpose", () => {
    const instruction = new PaymentInstruction({
      recipient,
      amount: Amount.fromPennies(100),
      purpose: PaymentPurpose.of("Line one\nLine two"),
    });

    expect(instruction.lines()[5]).toBe("Line one Line two");
  });

  it("includes sender phone number", () => {
    const instruction = new PaymentInstruction({
      recipient,
      amount: Amount.fromPennies(100),
      purpose: PaymentPurpose.of("Test"),
      sender: {
        ...sender,
        phoneNumber: PhoneNumber.of("+38761234567"),
      },
    });

    expect(instruction.lines()[4]).toBe("+38761234567");
  });

  it("can be constructed via fluent builder", () => {
    const instruction = PaymentInstructionBuilder.create()
      .withRecipient(recipient)
      .withAmount(Amount.fromPennies(9862))
      .withPurpose(PaymentPurpose.of("Račun za vodu - april 2025"))
      .withReference({ value: "1234-5678-001" })
      .withSender(sender)
      .withPaymentPriority(PaymentPriority.regular())
      .build();

    const lines = instruction.toString().split("\n");

    expect(lines[0]).toBe("BIHUPP10");
    expect(lines[1]).toBe("Marko Marković");
    expect(lines[7]).toBe("Vodovod d.o.o.");
    expect(lines[12]).toBe("000000000009862");
    expect(lines).toHaveLength(23);
  });
});

// Amount

describe("Amount", () => {
  it("fromPennies", () => {
    expect(Amount.fromPennies(9862).pennies).toBe(9862);
  });

  it("fromBAM", () => {
    expect(Amount.fromBAM(98.62).pennies).toBe(9862);
  });

  it("fromString with decimal", () => {
    expect(Amount.fromString("98.62").pennies).toBe(9862);
  });

  it("fromString without decimal", () => {
    expect(Amount.fromString("9862").pennies).toBe(9862);
  });
});

// Validation

describe("Validation", () => {
  it("throws on recipient name too long", () => {
    expect(
      () =>
        new PaymentInstruction({
          recipient: { ...recipient, name: Name.of("A".repeat(51)) },
          amount: Amount.fromPennies(100),
          purpose: PaymentPurpose.of("Test"),
        }),
    ).toThrow(BihuppValidationError);
  });

  it("throws on invalid characters in name", () => {
    expect(
      () =>
        new PaymentInstruction({
          recipient: { ...recipient, name: Name.of("Invalid <script>") },
          amount: Amount.fromPennies(100),
          purpose: PaymentPurpose.of("Test"),
        }),
    ).toThrow(BihuppValidationError);
  });

  it("throws on more than 20 recipient accounts", () => {
    const accounts = Array.from({ length: 21 }, (_, i) => ({
      value: i.toString().padStart(16, "0"),
    }));
    expect(
      () =>
        new PaymentInstruction({
          recipient: {
            ...recipient,
            account: RecipientAccount.fromList(accounts),
          },
          amount: Amount.fromPennies(100),
          purpose: PaymentPurpose.of("Test"),
        }),
    ).toThrow(BihuppValidationError);
  });

  it("throws on phone without + prefix", () => {
    expect(
      () =>
        new PaymentInstruction({
          recipient,
          amount: Amount.fromPennies(100),
          purpose: PaymentPurpose.of("Test"),
          sender: { ...sender, phoneNumber: PhoneNumber.of("0038761234567") },
        }),
    ).toThrow(BihuppValidationError);
  });

  it("accepts Bosnian diacritics", () => {
    expect(
      () =>
        new PaymentInstruction({
          recipient: { ...recipient, name: Name.of("Čović Šarić Đukić") },
          amount: Amount.fromPennies(100),
          purpose: PaymentPurpose.of("Plaćanje računa"),
        }),
    ).not.toThrow();
  });

  it("validates with Zod schema", () => {
    const params = {
      recipient,
      amount: Amount.fromPennies(100),
      purpose: PaymentPurpose.of("Plaćanje računa"),
      sender: null,
      reference: null,
    };

    expect(() => validatePaymentInstructionWithSchema(params)).not.toThrow();
  });
});

// Parser

describe("parsePaymentInstruction", () => {
  it("round-trips correctly", () => {
    const original = new PaymentInstruction({
      recipient,
      amount: Amount.fromPennies(9862),
      purpose: PaymentPurpose.of("Račun za vodu"),
      reference: { value: "1234-5678-001" },
      sender,
    });

    const result = parsePaymentInstruction(original.toString());

    expect(result.success).toBe(true);
    if (!result.success) return;

    expect(result.instruction.recipient.name.value).toBe("Vodovod d.o.o.");
    expect(result.instruction.amount.pennies).toBe(9862);
    expect(result.instruction.purpose.value).toBe("Račun za vodu");
    expect(result.instruction.reference?.value).toBe("1234-5678-001");
    expect(result.instruction.sender?.name.value).toBe("Marko Marković");
  });

  it("returns failure for invalid payload", () => {
    const result = parsePaymentInstruction("NOT_BIHUPP\nsome data");
    expect(result.success).toBe(false);
  });

  it("returns failure for too-short payload", () => {
    const result = parsePaymentInstruction("BIHUPP10\nonly two lines");
    expect(result.success).toBe(false);
  });

  it("ignores currency line and defaults to BAM semantics", () => {
    const original = new PaymentInstruction({
      recipient,
      amount: Amount.fromPennies(100),
      purpose: PaymentPurpose.of("Test"),
      sender: null,
    })
      .toString()
      .replace("\nBAM\n", "\nEUR\n");

    const result = parsePaymentInstruction(original);
    expect(result.success).toBe(true);
  });

  it("defaults unknown priority code to regular", () => {
    const original = new PaymentInstruction({
      recipient,
      amount: Amount.fromPennies(100),
      purpose: PaymentPurpose.of("Test"),
      sender: null,
    })
      .toString()
      .replace(/\nN$/, "\nX");

    const result = parsePaymentInstruction(original);
    expect(result.success).toBe(true);
    if (!result.success) return;
    expect(result.instruction.paymentPriority?.code).toBe("N");
  });

  it("accepts payloads shorter than 23 lines by treating missing lines as empty", () => {
    const original = new PaymentInstruction({
      recipient,
      amount: Amount.fromPennies(100),
      purpose: PaymentPurpose.of("Test"),
      sender: null,
    }).toString();

    const shortened = original.split("\n").slice(0, 15).join("\n");
    const result = parsePaymentInstruction(shortened);
    expect(result.success).toBe(true);
  });
});
