import { test } from "node:test";
import assert from "node:assert/strict";
import { buildEmployeeStoredFilename } from "../src/lib/filename";
import { encryptAesGcm, decryptAesGcm, generateFileKey } from "../src/lib/crypto";
import { hasRole } from "../src/lib/guards";
import { UserRole } from "@prisma/client";

test("file naming uses Jakarta time and sanitized name", () => {
  const date = new Date(Date.UTC(2026, 0, 31, 7, 30));
  const filename = buildEmployeeStoredFilename("Budi Santoso", "KK", ".pdf", date);
  assert.equal(filename, "Budi_Santoso_KK_20260131-1430.pdf");
});

test("encryption/decryption roundtrip", () => {
  const key = generateFileKey();
  const data = Buffer.from("rahasia");
  const encrypted = encryptAesGcm(data, key);
  const decrypted = decryptAesGcm(encrypted.ciphertext, key, encrypted.iv);
  assert.equal(decrypted.toString("utf-8"), "rahasia");
});

test("access control guard honors role", () => {
  assert.equal(hasRole({ role: UserRole.HR }, UserRole.HR), true);
  assert.equal(hasRole({ role: UserRole.EMPLOYEE }, UserRole.HR), false);
});
