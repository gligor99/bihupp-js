import { parsePaymentInstruction, PaymentInstruction } from "bihupp-js";

// A sample BIHUPP10 payload with the public revenue block present (23 lines).
// You can replace this payload with any BIHUPP payload you want to verify.
const raw = `BIHUPP10
Example Company d.o.o.
Zmaja od Bosne 75
71000 Sarajevo

Porez na dobit

Trezor
Aleja Svetog Save 13
78000 Banja Luka
1234567890123456
1610000010680092
000000000500000
BAM
N
4200730150004
3
712115
01012024
31122024
077
1200200
7110578163`;

const parsed = parsePaymentInstruction(raw);

console.log("parse success:", parsed.success);

if (!parsed.success) {
  console.error(parsed.error);
  process.exitCode = 1;
} else {
  const regenerated = new PaymentInstruction(parsed.instruction).toString();
  const samePayload = regenerated === raw;

  console.log("same payload:", samePayload);
  console.log("line count:", regenerated.split("\n").length);

  if (!samePayload) {
    console.log("\n--- regenerated payload ---\n");
    console.log(regenerated);
    process.exitCode = 1;
  }
}
