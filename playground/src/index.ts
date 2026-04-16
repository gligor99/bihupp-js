import fs from "node:fs/promises";
import path from "node:path";

import QRCode from "qrcode";
import {
  Amount,
  AddressLine1,
  AddressLine2,
  Name,
  PaymentInstructionBuilder,
  PaymentPurpose,
  RecipientAccount,
} from "bihupp-js";

async function main() {
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
    .withPurpose(PaymentPurpose.of("Račun za vodu - april 2024"))
    .withReference({ value: "1234-5678-001" })
    .withSender({
      name: Name.individual("Marko", "Marković"),
      address: {
        addressLine1: AddressLine1.of("Ulica Meše Selimovića", "12"),
        addressLine2: AddressLine2.of("78000", "Banja Luka"),
      },
      account: { value: "1234567890123456" },
      // phoneNumber: { value: "+38761234567" },
    })
    .build();

  const lines = instruction.lines();
  const payload = lines.join("\n");

  console.log("BIHUPP payload (line-numbered):");
  for (let i = 0; i < lines.length; i++) {
    console.log(`${String(i).padStart(2, "0")}: ${lines[i] ?? ""}`);
  }
  console.log("");

  // 2) PNG file QR
  const outDir = path.resolve(process.cwd(), "out");
  await fs.mkdir(outDir, { recursive: true });

  const outPath = path.join(outDir, "bihupp.png");
  await QRCode.toFile(outPath, payload, {
    errorCorrectionLevel: "M",
    margin: 2,
    scale: 8,
  });

  console.log(`QR saved to: ${outPath}`);
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
