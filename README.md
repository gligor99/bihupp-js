# bihupp-js

JavaScript/TypeScript library implementing the **BIHUPP10** standard for bank payment instructions in Bosnia and Herzegovina.

**BIHUPP** (_Bosansko-Hercegovački Unutrašnji Platni Promet_) defines a structured text payload that can be encoded as a QR code that banks scan to pre-fill payment forms. This format was established by the [Association of Banks of Bosnia and Herzegovina](https://ubbih.ba/).

Inspired by Saša B.'s BIHUPP QR libraries: [`php-bihupp-qrcode`](https://github.com/sasa-b/php-bihupp-qrcode) and [`kotlin-bihupp-qrcode`](https://github.com/sasa-b/kotlin-bihupp-qrcode).

---

## Installation

```bash
npm install bihupp-js
# or
yarn add bihupp-js
# or
pnpm add bihupp-js
```

Zero dependencies. Works in Node.js, browsers, React Native, Next.js, and any JavaScript environment.

---

## Quick start

```ts
import {
  PaymentInstruction,
  Name,
  AddressLine1,
  AddressLine2,
  Amount,
  PaymentPurpose,
  RecipientAccount,
} from "bihupp-js";

const instruction = new PaymentInstruction({
  recipient: {
    name: Name.business("Vodovod d.o.o."),
    address: {
      addressLine1: AddressLine1.of("Kralja Petra I Karađorđevića", "97"),
      addressLine2: AddressLine2.of("78000", "Banja Luka"),
    },
    account: RecipientAccount.of({ value: "9876543210987654" }),
  },
  amount: Amount.fromBAM(98.62), // or Amount.fromPennies(9862)
  purpose: PaymentPurpose.of("Račun za vodu - april 2025"),
  reference: { value: "1234-5678-001" },
});

const payload = instruction.toString(); // BIHUPP10 string → encode into QR
```

---

## Usage

### Fluent builder

If you prefer a fluent API, you can use `PaymentInstructionBuilder`:

```ts
import {
  PaymentInstructionBuilder,
  Name,
  AddressLine1,
  AddressLine2,
  Amount,
  PaymentPurpose,
  RecipientAccount,
} from "bihupp-js";

const instruction = PaymentInstructionBuilder.create()
  .withRecipient({
    name: Name.business("Vodovod d.o.o."),
    address: {
      addressLine1: AddressLine1.of("Kralja Petra I Karađorđevića", "97"),
      addressLine2: AddressLine2.of("78000", "Banja Luka"),
    },
    account: RecipientAccount.of({ value: "9876543210987654" }),
  })
  .withAmount(Amount.fromBAM(98.62))
  .withPurpose(PaymentPurpose.of("Račun za vodu - april 2025"))
  .build();
```

### Standard bank transfer

```ts
import {
  PaymentInstruction,
  Name,
  AddressLine1,
  AddressLine2,
  Amount,
  PaymentPurpose,
  PaymentPriority,
  RecipientAccount,
} from "bihupp-js";

const instruction = new PaymentInstruction({
  recipient: {
    name: Name.business("Example Company d.o.o."),
    address: {
      addressLine1: AddressLine1.of("Zmaja od Bosne", "75"),
      addressLine2: AddressLine2.of("71000", "Sarajevo"),
    },
    account: RecipientAccount.of({ value: "9876543210987654" }),
  },
  amount: Amount.fromPennies(10000), // 100.00 BAM
  purpose: PaymentPurpose.of("Invoice payment"),
  reference: { value: "INV-2025-001" },
  paymentPriority: PaymentPriority.regular(), // default, can be omitted
});
```

### Omitting the sender

When `sender` is `null` or omitted, the bank pre-fills payer details from the logged-in user's session.

```ts
const instruction = new PaymentInstruction({
  recipient,
  amount: Amount.fromBAM(50),
  purpose: PaymentPurpose.of("Uplata članarine"),
  sender: null,
});
```

### Including a sender

```ts
import { PhoneNumber } from "bihupp-js";

const instruction = new PaymentInstruction({
  recipient,
  amount: Amount.fromBAM(150),
  purpose: PaymentPurpose.of("Plaćanje računa"),
  sender: {
    name: Name.individual("Marko", "Marković"),
    address: {
      addressLine1: AddressLine1.of("Ulica Meše Selimovića", "12"),
      addressLine2: AddressLine2.of("78000", "Banja Luka"),
    },
    account: { value: "1234567890123456" },
    phoneNumber: PhoneNumber.of("+38761234567"), // E.164, optional
  },
});
```

### Multiple recipient accounts (up to 20)

```ts
const instruction = new PaymentInstruction({
  recipient: {
    ...recipient,
    account: RecipientAccount.of(
      { value: "1234567890123456" },
      { value: "9876543210987654" },
      { value: "1111222233334444" },
    ),
  },
  amount: Amount.fromPennies(5000),
  purpose: PaymentPurpose.of("Test"),
});
```

### Public revenue payment (tax, fees, etc.)

```ts
const instruction = new PaymentInstruction({
  recipient: {
    name: Name.of("Trezor"),
    address: {
      addressLine1: AddressLine1.of("Aleja Svetog Save", "13"),
      addressLine2: AddressLine2.of("78000", "Banja Luka"),
    },
    account: RecipientAccount.of({ value: "1610000010680092" }),
  },
  amount: Amount.fromBAM(5000),
  purpose: PaymentPurpose.of("Porez na dobit"),
  reference: null,
  publicRevenue: {
    senderTaxId: "4200730150004", // 13 digits (JIB/JMBG)
    paymentType: "3", // single digit
    revenueType: "712115", // 6 digits
    taxPeriodStartDate: "01012024", // ddMMyyyy
    taxPeriodEndDate: "31122024", // ddMMyyyy
    municipalCode: "077", // 3 digits
    budgetOrgCode: "1200200", // 7 digits
    paymentReference: "7110578163", // 10 digits
  },
});
```

### Reading the payload

```ts
// Get the raw BIHUPP10 string (encode this into a QR code)
const payload: string = instruction.toString();

// Get as array of lines
const lines: string[] = instruction.lines();

// Human-readable debug output
console.log(instruction.inspect());
```

### Parsing a scanned QR code

```ts
import { parsePaymentInstruction } from "bihupp-js";

const result = parsePaymentInstruction(rawStringFromScanner);

if (result.success) {
  const { instruction } = result;
  console.log(instruction.recipient.name.value);
  console.log(instruction.amount.pennies / 100, "BAM");
} else {
  console.error(result.error.message);
}
```

---

## Amount handling

`Amount` stores the value as an integer number of **pennies (pfeniga)**:

```ts
Amount.fromPennies(9862); // 98.62 BAM — from integer pennies
Amount.fromBAM(98.62); // 98.62 BAM — from decimal
Amount.fromString("98.62"); // 98.62 BAM — from string (decimal stripped)
Amount.fromString("9862"); // 98.62 BAM — from string pennies
```

---

## Field reference

### `PaymentInstruction` constructor

| Parameter         | Type                               | Required | Default     | Notes                    |
| ----------------- | ---------------------------------- | -------- | ----------- | ------------------------ |
| `recipient`       | `Recipient`                        | ✅       | —           |                          |
| `purpose`         | `PaymentPurpose`                   | ✅       | —           | Max 110 chars            |
| `amount`          | `Amount`                           | ✅       | —           | Integer pennies          |
| `sender`          | `Sender \| null`                   | ❌       | `undefined` | Omit / `null` = bank auto-fills |
| `reference`       | `PaymentReference \| null`         | ❌       | `undefined` | Max 30 chars             |
| `paymentPriority` | `PaymentPriority`                  | ❌       | `regular()` | `N` or `D`               |
| `publicRevenue`   | `PublicRevenueInstruction \| null` | ❌       | `undefined` | Tax/fee payments         |

### Field constraints

#### Sender / Recipient

| Field                 | Max length | Format / Notes                          |
| --------------------- | ---------- | --------------------------------------- |
| `name`                | 50         | Alphanumeric + allowed chars            |
| `addressLine1`        | 50         | Street + number                         |
| `addressLine2`        | 25         | Postcode + city                         |
| `phoneNumber`         | 15         | E.164, must start with `+`              |
| sender `account`      | 16         | Digits only                              |
| recipient `account(s)`| —          | 1–20 accounts, digits only, comma-separated |

#### Payment detail

| Field       | Max length | Format / Notes                               |
| ----------- | ---------- | -------------------------------------------- |
| `purpose`   | 110        | Newlines normalized to spaces                 |
| `reference` | 30         |                                              |
| `amount`    | 15         | Integer pennies (pfeninzi), **zero-padded**  |

#### Public revenue fields

| Field                 | Length | Format           |
| --------------------- | ------ | ---------------- |
| `senderTaxId`         | 13     | Exactly 13 digits (JIB/JMBG) |
| `paymentType`         | 1      | Single digit (`0`–`9`)       |
| `revenueType`         | 6      | Exactly 6 digits             |
| `taxPeriodStartDate`  | 8      | `ddMMyyyy` (8 digits)        |
| `taxPeriodEndDate`    | 8      | `ddMMyyyy` (8 digits)        |
| `municipalCode`       | 3      | Exactly 3 digits             |
| `budgetOrgCode`       | 7      | Exactly 7 digits             |
| `paymentReference`    | 10     | Exactly 10 digits            |

### Allowed character set

Alphanumeric + Bosnian/Croatian/Serbian diacritics (`č ć đ š ž Č Ć Đ Š Ž`) + `, : . ? ( ) + ' / -` and space.

---

## Error handling

All validation runs at construction time and throws `BihuppValidationError`:

```ts
import { BihuppValidationError } from 'bihupp-js';

try {
  const instruction = new PaymentInstruction({ ... });
} catch (err) {
  if (err instanceof BihuppValidationError) {
    console.error(err.field);   // e.g. "recipient.name"
    console.error(err.message); // e.g. "[recipient.name] Exceeds maximum length of 50, got 51."
  }
}
```

### Zod schema-based validation (optional)

For schema-driven validation and richer error information you can use the optional Zod layer. It lives in a separate entry point, so the core package stays dependency-free. Install `zod` (v4) alongside:

```bash
npm install zod
```

```ts
import {
  paymentInstructionParamsSchema,
  validatePaymentInstructionWithSchema,
} from "bihupp-js/zod";

// Validate with Zod schema (throws ZodError on failure)
const parsed = paymentInstructionParamsSchema.parse(params);

// Or via helper
validatePaymentInstructionWithSchema(params);
```

---

## License

MIT — see [LICENSE](LICENSE).
