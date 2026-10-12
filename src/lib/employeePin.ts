/**
 * Employee PIN storage helpers
 * Employee PINs are never stored as plain text. Each row holds:
 * - pin_lookup: keyed hash (HMAC-SHA256) of the PIN, used for login lookup and the uniqueness constraint
 * - pin_encrypted: the PIN encrypted with AES-256-GCM, so it can be recovered server-side if needed
 * Both keys are derived from EMPLOYEE_PIN_SECRET. Losing that secret makes every stored PIN unusable.
 *
 * Only node:crypto is imported here so scripts/backfill-employee-pins.mjs can load this file directly.
 */
import {
  createCipheriv,
  createDecipheriv,
  createHmac,
  hkdfSync,
  randomBytes,
} from "node:crypto";

const ENCRYPTION_VERSION = "v1";
const MIN_SECRET_LENGTH = 32;

/**
 * Derive a 32-byte key for one purpose from EMPLOYEE_PIN_SECRET
 * @param purpose - Label that keeps the lookup and encryption keys independent
 * @returns Derived key
 */
function deriveKey(purpose: "lookup" | "encrypt"): Buffer {
  const secret = process.env.EMPLOYEE_PIN_SECRET;
  if (!secret || secret.length < MIN_SECRET_LENGTH) {
    throw new Error(
      `EMPLOYEE_PIN_SECRET must be set to at least ${MIN_SECRET_LENGTH} characters`,
    );
  }
  return Buffer.from(
    hkdfSync("sha256", secret, "", `timetally:employee-pin:${purpose}`, 32),
  );
}

/**
 * Compute the lookup value stored in employees.pin_lookup
 * The client ID is part of the input, so the same PIN gives a different value in each tenant
 * @param clientId - Client the employee belongs to
 * @param pin - Plain text 4-digit PIN
 * @returns Hex-encoded keyed hash
 */
export function pinLookup(clientId: string, pin: string): string {
  return createHmac("sha256", deriveKey("lookup"))
    .update(`${clientId}:${pin}`)
    .digest("hex");
}

/**
 * Encrypt a PIN for storage in employees.pin_encrypted
 * The client ID is bound in as authenticated data, so a value copied to another tenant will not decrypt
 * @param clientId - Client the employee belongs to
 * @param pin - Plain text 4-digit PIN
 * @returns Versioned string: v1.<iv>.<auth tag>.<ciphertext>
 */
export function encryptPin(clientId: string, pin: string): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", deriveKey("encrypt"), iv);
  cipher.setAAD(Buffer.from(clientId));
  const ciphertext = Buffer.concat([cipher.update(pin, "utf8"), cipher.final()]);
  return [
    ENCRYPTION_VERSION,
    iv.toString("base64url"),
    cipher.getAuthTag().toString("base64url"),
    ciphertext.toString("base64url"),
  ].join(".");
}

/**
 * Decrypt a value produced by encryptPin
 * @param clientId - Client the employee belongs to
 * @param encrypted - Value from employees.pin_encrypted
 * @returns Plain text PIN
 */
export function decryptPin(clientId: string, encrypted: string): string {
  const [version, iv, tag, ciphertext] = encrypted.split(".");
  if (version !== ENCRYPTION_VERSION || !iv || !tag || !ciphertext) {
    throw new Error("Unrecognised encrypted PIN format");
  }
  const decipher = createDecipheriv(
    "aes-256-gcm",
    deriveKey("encrypt"),
    Buffer.from(iv, "base64url"),
  );
  decipher.setAAD(Buffer.from(clientId));
  decipher.setAuthTag(Buffer.from(tag, "base64url"));
  return Buffer.concat([
    decipher.update(Buffer.from(ciphertext, "base64url")),
    decipher.final(),
  ]).toString("utf8");
}

/**
 * Build the PIN columns to write when setting an employee's PIN
 * Clears the legacy plain text column in the same write
 * @param clientId - Client the employee belongs to
 * @param pin - Plain text 4-digit PIN
 * @returns Column values for an insert or update on employees
 */
export function pinColumns(
  clientId: string,
  pin: string,
): { pin: null; pin_lookup: string; pin_encrypted: string } {
  return {
    pin: null,
    pin_lookup: pinLookup(clientId, pin),
    pin_encrypted: encryptPin(clientId, pin),
  };
}
