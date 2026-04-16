import {
  ALLOWED_CHARS_REGEX,
  BihuppValidationError,
  type PaymentInstructionParams,
} from "./types.js";

// Helpers
function assertMaxLength(field: string, value: string, max: number): void {
  if (value.length > max) {
    throw new BihuppValidationError(
      field,
      `Exceeds maximum length of ${max}, got ${value.length}.`,
    );
  }
}

function assertExactLength(field: string, value: string, length: number): void {
  if (value.length !== length) {
    throw new BihuppValidationError(
      field,
      `Must be exactly ${length} characters, got ${value.length}.`,
    );
  }
}

function assertOnlyDigits(field: string, value: string): void {
  if (!/^\d+$/.test(value)) {
    throw new BihuppValidationError(field, `Must contain only digits.`);
  }
}

function assertAllowedChars(field: string, value: string): void {
  if (!ALLOWED_CHARS_REGEX.test(value)) {
    throw new BihuppValidationError(
      field,
      `Contains invalid characters. Allowed: alphanumeric, Bosnian diacritics (čćđšžČĆĐŠŽ), and , : . ? ( ) + ' / - and space.`,
    );
  }
}

function assertSingleDigit(field: string, value: string): void {
  if (!/^[0-9]$/.test(value)) {
    throw new BihuppValidationError(field, `Must be a single digit (0-9).`);
  }
}

// Date format ddMMyyyy
function assertDateFormat(field: string, value: string): void {
  if (!/^\d{8}$/.test(value)) {
    throw new BihuppValidationError(
      field,
      `Must be in ddMMyyyy format (8 digits), got "${value}".`,
    );
  }
}

// Public API
export function validatePaymentInstruction(
  params: PaymentInstructionParams,
): void {
  // Recipient name
  assertAllowedChars("recipient.name", params.recipient.name.value);
  assertMaxLength("recipient.name", params.recipient.name.value, 50);

  // Recipient address
  assertAllowedChars(
    "recipient.address.line1",
    params.recipient.address.addressLine1.value,
  );
  assertMaxLength(
    "recipient.address.line1",
    params.recipient.address.addressLine1.value,
    50,
  );
  assertAllowedChars(
    "recipient.address.line2",
    params.recipient.address.addressLine2.value,
  );
  assertMaxLength(
    "recipient.address.line2",
    params.recipient.address.addressLine2.value,
    25,
  );

  // Recipient accounts (1–20)
  const { accounts } = params.recipient.account;
  if (accounts.length === 0) {
    throw new BihuppValidationError(
      "recipient.account",
      "At least one recipient account is required.",
    );
  }
  if (accounts.length > 20) {
    throw new BihuppValidationError(
      "recipient.account",
      `Maximum 20 recipient accounts allowed, got ${accounts.length}.`,
    );
  }
  for (const [i, acc] of accounts.entries()) {
    assertOnlyDigits(`recipient.account[${i}]`, acc.value);
    assertMaxLength(`recipient.account[${i}]`, acc.value, 16);
  }

  // Amount
  if (params.amount.pennies < 0) {
    throw new BihuppValidationError("amount", "Amount must be non-negative.");
  }
  const amountStr = params.amount.pennies.toString();
  if (amountStr.length > 15) {
    throw new BihuppValidationError(
      "amount",
      `Amount exceeds maximum of 15 digits (got ${amountStr.length}).`,
    );
  }

  // Purpose
  assertAllowedChars("purpose", params.purpose.value);
  assertMaxLength("purpose", params.purpose.value, 110);

  // Reference (optional)
  if (params.reference != null) {
    assertAllowedChars("reference", params.reference.value);
    assertMaxLength("reference", params.reference.value, 30);
  }

  // Sender (optional)
  if (params.sender != null) {
    assertAllowedChars("sender.name", params.sender.name.value);
    assertMaxLength("sender.name", params.sender.name.value, 50);

    assertAllowedChars(
      "sender.address.line1",
      params.sender.address.addressLine1.value,
    );
    assertMaxLength(
      "sender.address.line1",
      params.sender.address.addressLine1.value,
      50,
    );
    assertAllowedChars(
      "sender.address.line2",
      params.sender.address.addressLine2.value,
    );
    assertMaxLength(
      "sender.address.line2",
      params.sender.address.addressLine2.value,
      25,
    );

    assertOnlyDigits("sender.account", params.sender.account.value);
    assertMaxLength("sender.account", params.sender.account.value, 16);

    if (params.sender.phoneNumber != null) {
      const phone = params.sender.phoneNumber.value;
      if (!phone.startsWith("+")) {
        throw new BihuppValidationError(
          "sender.phoneNumber",
          "Phone number must be in E.164 format starting with +.",
        );
      }
      assertMaxLength("sender.phoneNumber", phone, 15);
    }
  }

  // Public revenue (optional)
  if (params.publicRevenue != null) {
    const pr = params.publicRevenue;

    assertOnlyDigits("publicRevenue.senderTaxId", pr.senderTaxId);
    assertExactLength("publicRevenue.senderTaxId", pr.senderTaxId, 13);

    assertSingleDigit("publicRevenue.paymentType", pr.paymentType);

    assertOnlyDigits("publicRevenue.revenueType", pr.revenueType);
    assertExactLength("publicRevenue.revenueType", pr.revenueType, 6);

    assertDateFormat("publicRevenue.taxPeriodStartDate", pr.taxPeriodStartDate);
    assertDateFormat("publicRevenue.taxPeriodEndDate", pr.taxPeriodEndDate);

    assertOnlyDigits("publicRevenue.municipalCode", pr.municipalCode);
    assertExactLength("publicRevenue.municipalCode", pr.municipalCode, 3);

    assertOnlyDigits("publicRevenue.budgetOrgCode", pr.budgetOrgCode);
    assertExactLength("publicRevenue.budgetOrgCode", pr.budgetOrgCode, 7);

    assertOnlyDigits("publicRevenue.paymentReference", pr.paymentReference);
    assertExactLength(
      "publicRevenue.paymentReference",
      pr.paymentReference,
      10,
    );
  }
}
