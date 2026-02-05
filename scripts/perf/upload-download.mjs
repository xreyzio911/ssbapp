import fs from "fs/promises";
import path from "path";
import { performance } from "node:perf_hooks";

const baseUrl = (process.env.PERF_BASE_URL || "http://localhost:3000").replace(
  /\/$/,
  ""
);
const cookie = process.env.PERF_COOKIE;
const filePath = process.env.PERF_FILE;
const docType = (process.env.PERF_DOC_TYPE || "KTP").toUpperCase();
const mimeType = process.env.PERF_MIME;
const downloadUrlRaw = process.env.PERF_DOWNLOAD_URL;
const outDir = process.env.PERF_OUT_DIR || "perf-results";
const timestamp = new Date().toISOString().replace(/[:.]/g, "-");

if (!cookie) {
  console.error("PERF_COOKIE is required (session cookie from browser).");
  process.exit(1);
}
if (!filePath) {
  console.error("PERF_FILE is required (path to a PDF/JPG/PNG).");
  process.exit(1);
}

const buffer = await fs.readFile(filePath);
const fileName = path.basename(filePath);
const fileMime =
  mimeType ||
  (fileName.toLowerCase().endsWith(".pdf")
    ? "application/pdf"
    : fileName.toLowerCase().endsWith(".png")
    ? "image/png"
    : fileName.toLowerCase().endsWith(".jpg") ||
      fileName.toLowerCase().endsWith(".jpeg")
    ? "image/jpeg"
    : "application/octet-stream");

await fs.mkdir(outDir, { recursive: true });

const results = {
  baseUrl,
  docType,
  fileName,
  fileSize: buffer.length,
  upload: null,
  download: null,
};

function elapsed(start) {
  return Math.round((performance.now() - start) * 100) / 100;
}

async function fetchWithCookie(url, init) {
  const headers = new Headers(init?.headers || {});
  headers.set("Cookie", cookie);
  return fetch(url, { ...init, headers });
}

const presignStart = performance.now();
const presignRes = await fetchWithCookie(`${baseUrl}/api/employee/documents/presign`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    docType,
    fileName,
    mimeType: fileMime,
    size: buffer.length,
  }),
});
const presignMs = elapsed(presignStart);

if (presignRes.ok) {
  const presign = await presignRes.json();
  const uploadStart = performance.now();
  const uploadRes = await fetch(presign.uploadUrl, {
    method: "PUT",
    headers: { "Content-Type": fileMime },
    body: buffer,
  });
  const uploadMs = elapsed(uploadStart);
  if (!uploadRes.ok) {
    throw new Error(`S3 upload failed: ${uploadRes.status}`);
  }

  const completeStart = performance.now();
  const completeRes = await fetchWithCookie(
    `${baseUrl}/api/employee/documents/complete`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ uploadToken: presign.uploadToken }),
    }
  );
  const completeMs = elapsed(completeStart);
  if (!completeRes.ok) {
    const data = await completeRes.json().catch(() => ({}));
    throw new Error(data.error || "Complete failed.");
  }

  results.upload = {
    mode: "s3-presign",
    presignMs,
    uploadMs,
    completeMs,
    totalMs: Math.round((presignMs + uploadMs + completeMs) * 100) / 100,
  };
} else {
  const presignError = await presignRes.json().catch(() => ({}));
  if (presignError?.error !== "STORAGE_NOT_S3") {
    throw new Error(presignError?.error || "Presign failed.");
  }

  const formData = new FormData();
  formData.append("docType", docType);
  formData.append(
    "file",
    new Blob([buffer], { type: fileMime }),
    fileName
  );

  const uploadStart = performance.now();
  const uploadRes = await fetchWithCookie(
    `${baseUrl}/api/employee/documents/upload`,
    {
      method: "POST",
      body: formData,
    }
  );
  const uploadMs = elapsed(uploadStart);
  if (!uploadRes.ok) {
    const data = await uploadRes.json().catch(() => ({}));
    throw new Error(data.error || "Local upload failed.");
  }

  results.upload = {
    mode: "local",
    uploadMs,
    totalMs: uploadMs,
  };
}

if (downloadUrlRaw) {
  const downloadUrl = downloadUrlRaw.startsWith("http")
    ? downloadUrlRaw
    : `${baseUrl}${downloadUrlRaw}`;
  const downloadStart = performance.now();
  const downloadRes = await fetchWithCookie(downloadUrl, { method: "GET" });
  if (!downloadRes.ok) {
    throw new Error(`Download failed: ${downloadRes.status}`);
  }
  const bytes = await downloadRes.arrayBuffer();
  const downloadMs = elapsed(downloadStart);
  results.download = {
    url: downloadUrl,
    bytes: bytes.byteLength,
    downloadMs,
  };
}

const outPath = path.join(outDir, `${timestamp}-upload-download.json`);
await fs.writeFile(outPath, JSON.stringify(results, null, 2));

console.log("Upload/download timing written:", outPath);
console.log(JSON.stringify(results, null, 2));
