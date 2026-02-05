import crypto from "crypto";
import { getMasterKey } from "./crypto";

export type UploadTokenPayload = {
  userId: string;
  docType: string;
  originalFilename: string;
  storedFilename: string;
  storagePath: string;
  mimeType: string;
  size: number;
  exp: number;
};

function signPayload(payloadBase64: string) {
  return crypto
    .createHmac("sha256", getMasterKey())
    .update(payloadBase64)
    .digest("base64url");
}

export function createUploadToken(payload: UploadTokenPayload) {
  const payloadBase64 = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const signature = signPayload(payloadBase64);
  return `${payloadBase64}.${signature}`;
}

export function verifyUploadToken(token: string) {
  const [payloadBase64, signature] = token.split(".");
  if (!payloadBase64 || !signature) {
    return null;
  }
  const expected = signPayload(payloadBase64);
  if (signature.length !== expected.length) {
    return null;
  }
  if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected))) {
    return null;
  }
  try {
    const payload = JSON.parse(
      Buffer.from(payloadBase64, "base64url").toString("utf8")
    ) as UploadTokenPayload;
    return payload;
  } catch {
    return null;
  }
}
