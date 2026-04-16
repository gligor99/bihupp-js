// Character set
// Alphanumeric + Bosnian/Croatian/Serbian diacritics + allowed symbols + space
export const ALLOWED_CHARS_REGEX = /^[a-zA-Z0-9čćđšžČĆĐŠŽ ,:.?()+'\/-]*$/;

// Version
export const BIHUPP_VERSION = "BIHUPP10" as const;
export const BIHUPP_CURRENCY = "BAM" as const;

// Payment Priority
export type PaymentPriorityCode = "N" | "D";

export interface PaymentPriority {
  code: PaymentPriorityCode;
}

export const PaymentPriority = {
  regular: (): PaymentPriority => ({ code: "N" }),
  urgent: (): PaymentPriority => ({ code: "D" }),
} as const;

// Name
export interface Name {
  value: string;
}

export const Name = {
  /** Individual person: "Marko Marković" */
  individual: (firstName: string, lastName: string): Name => ({
    value: `${firstName} ${lastName}`,
  }),
  /** Business entity */
  business: (name: string): Name => ({ value: name }),
  /** Raw value */
  of: (value: string): Name => ({ value }),
} as const;

// Address
export interface AddressLine1 {
  value: string;
}

export const AddressLine1 = {
  /** Street + number: "Ulica Meše Selimovića 12" */
  of: (street: string, number: string): AddressLine1 => ({
    value: `${street} ${number}`,
  }),
  raw: (value: string): AddressLine1 => ({ value }),
} as const;

export interface AddressLine2 {
  value: string;
}

export const AddressLine2 = {
  /** Postcode + city: "78000 Banja Luka" */
  of: (postcode: string, city: string): AddressLine2 => ({
    value: `${postcode} ${city}`,
  }),
  raw: (value: string): AddressLine2 => ({ value }),
} as const;

export interface Address {
  addressLine1: AddressLine1;
  addressLine2: AddressLine2;
}

// Account
export interface Account {
  value: string; // 16-digit account number
}

export interface RecipientAccount {
  accounts: Account[]; // 1–20 accounts
}

export const RecipientAccount = {
  of: (...accounts: Account[]): RecipientAccount => ({ accounts }),
  fromList: (accounts: Account[]): RecipientAccount => ({ accounts }),
} as const;

// Phone
export interface PhoneNumber {
  value: string; // E.164 format, "+" prefix required
}

export const PhoneNumber = {
  /** Strips spaces, ensures E.164 format */
  of: (value: string): PhoneNumber => ({
    value: value.replace(/\s/g, ""),
  }),
} as const;

// Amount
export interface Amount {
  pennies: number; // stored as integer pennies (pfeniga)
}

export const Amount = {
  /** From integer pennies: Amount.fromPennies(9862) = 98.62 BAM */
  fromPennies: (pennies: number): Amount => ({ pennies }),
  /** From BAM decimal: Amount.fromBAM(98.62) */
  fromBAM: (bam: number): Amount => ({
    pennies: Math.round(bam * 100),
  }),
  /** From string: "98.62" or "9862" */
  fromString: (value: string): Amount => {
    const stripped = value.replace(".", "");
    return { pennies: parseInt(stripped, 10) };
  },
} as const;

// Payment Purpose & Reference
export interface PaymentPurpose {
  value: string; // max 110 chars, newlines normalized to spaces
}

export const PaymentPurpose = {
  of: (value: string): PaymentPurpose => ({
    value: value.replace(/\n/g, " ").replace(/\r/g, ""),
  }),
} as const;

export interface PaymentReference {
  value: string; // max 30 chars
}

// Sender
export interface Sender {
  name: Name;
  address: Address;
  account: Account;
  phoneNumber?: PhoneNumber | undefined;
}

// Recipient
export interface Recipient {
  name: Name;
  address: Address;
  account: RecipientAccount;
}

// Public Revenue (porezi, takse)
export interface PublicRevenueInstruction {
  senderTaxId: string; // 13 digits (JIB/JMBG)
  paymentType: string; // single digit 0-9
  revenueType: string; // exactly 6 digits
  taxPeriodStartDate: string; // ddMMyyyy
  taxPeriodEndDate: string; // ddMMyyyy
  municipalCode: string; // exactly 3 digits
  budgetOrgCode: string; // exactly 7 digits
  paymentReference: string; // exactly 10 digits
}

// Payment Instruction
export interface PaymentInstructionParams {
  recipient: Recipient;
  purpose: PaymentPurpose;
  amount: Amount;
  sender?: Sender | null;
  reference?: PaymentReference | null;
  paymentPriority?: PaymentPriority;
  publicRevenue?: PublicRevenueInstruction | null;
}

// Parse Result
export type ParseResult =
  | { success: true; instruction: PaymentInstructionParams; rawPayload: string }
  | { success: false; error: Error; rawPayload: string | null };

// Validation Error
export class BihuppValidationError extends Error {
  constructor(
    public readonly field: string,
    message: string,
  ) {
    super(`[${field}] ${message}`);
    this.name = "BihuppValidationError";
  }
}
