import crypto from "crypto";

const AES_GCM_IV_LENGTH = 12;
const AES_GCM_TAG_LENGTH = 16;
const FILE_KEY_LENGTH = 32;
const PBKDF2_ITERATIONS = 310000;

export function generateToken(bytes = 32) {
  return crypto.randomBytes(bytes).toString("base64url");
}

export function hashToken(token: string) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

export function getMasterKey() {
  const raw = process.env.APP_FILE_ENC_KEY;
  if (!raw) {
    throw new Error("APP_FILE_ENC_KEY is required");
  }
  const key = Buffer.from(raw, "base64");
  if (key.length !== FILE_KEY_LENGTH) {
    throw new Error("APP_FILE_ENC_KEY must be 32 bytes base64");
  }
  return key;
}

export function generateFileKey() {
  return crypto.randomBytes(FILE_KEY_LENGTH);
}

export function encryptAesGcm(plaintext: Buffer, key: Buffer, iv?: Buffer) {
  const ivBuf = iv ?? crypto.randomBytes(AES_GCM_IV_LENGTH);
  const cipher = crypto.createCipheriv("aes-256-gcm", key, ivBuf);
  const encrypted = Buffer.concat([cipher.update(plaintext), cipher.final()]);
  const tag = cipher.getAuthTag();
  return {
    ciphertext: Buffer.concat([encrypted, tag]),
    iv: ivBuf,
  };
}

export function decryptAesGcm(ciphertext: Buffer, key: Buffer, iv: Buffer) {
  const tag = ciphertext.subarray(ciphertext.length - AES_GCM_TAG_LENGTH);
  const data = ciphertext.subarray(0, ciphertext.length - AES_GCM_TAG_LENGTH);
  const decipher = crypto.createDecipheriv("aes-256-gcm", key, iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(data), decipher.final()]);
}

export function encryptFileKeyWithMaster(fileKey: Buffer) {
  const master = getMasterKey();
  const { ciphertext, iv } = encryptAesGcm(fileKey, master);
  return { ciphertext, iv };
}

export function decryptFileKeyWithMaster(ciphertext: Buffer, iv: Buffer) {
  const master = getMasterKey();
  return decryptAesGcm(ciphertext, master, iv);
}

export function encryptFileKeyWithPassword(fileKey: Buffer, password: string) {
  const salt = crypto.randomBytes(16);
  const iv = crypto.randomBytes(AES_GCM_IV_LENGTH);
  const key = crypto.pbkdf2Sync(
    password,
    salt,
    PBKDF2_ITERATIONS,
    FILE_KEY_LENGTH,
    "sha256"
  );
  const { ciphertext } = encryptAesGcm(fileKey, key, iv);
  return {
    ciphertext,
    iv,
    salt,
    iterations: PBKDF2_ITERATIONS,
  };
}
