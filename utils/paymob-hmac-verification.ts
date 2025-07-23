import crypto, { timingSafeEqual } from "crypto";
const PAYMOB_HMAC_SECRET = process.env.PAYMOB_HMAC_SECRET;
const HMAC_KEYS = [
  "amount_cents",
  "created_at",
  "currency",
  "error_occured",
  "has_parent_transaction",
  "id",
  "integration_id",
  "is_3d_secure",
  "is_auth",
  "is_capture",
  "is_refunded",
  "is_standalone_payment",
  "is_voided",
  "order.id",
  "owner",
  "pending",
  "source_data.pan",
  "source_data.sub_type",
  "source_data.type",
  "success",
];

export function verifyPaymobCallbackHMAC(data: any, receivedHmac: string) {
  if (!receivedHmac) {
    return false;
  }
  const concatValues = HMAC_KEYS.map((key) => {
    const parts = key.split(".");
    let value = data;

    for (const part of parts) {
      value = value?.[part];
      if (value === undefined) break;
    }

    return String(value ?? "");
  }).join("");

  const hmac = crypto
    .createHmac("sha512", PAYMOB_HMAC_SECRET!)
    .update(concatValues)
    .digest("hex");

  return timingSafeEqual(Buffer.from(hmac), Buffer.from(receivedHmac));
}

export function verifyPaymobSubscriptionHmac(payload: any): boolean {
  if (
    !payload.subscription_data?.id ||
    !payload.trigger_type ||
    !payload.hmac
  ) {
    return false;
  }
  const { id } = payload.subscription_data;

  const concatenatedString = `${payload.trigger_type}for${id}`;

  const calculatedHmac = crypto
    .createHmac("sha512", PAYMOB_HMAC_SECRET!)
    .update(concatenatedString)
    .digest("hex");

  return crypto.timingSafeEqual(
    Buffer.from(calculatedHmac),
    Buffer.from(payload.hmac)
  );
}
