import { promises as fs } from "fs";
import path from "path";
import { createReadStream } from "fs";
import os from "os";
import { S3Client, PutObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";

function hasS3EnvConfig() {
  return Boolean(
    process.env.S3_REGION &&
      process.env.S3_BUCKET &&
      process.env.S3_ACCESS_KEY_ID &&
      process.env.S3_SECRET_ACCESS_KEY
  );
}

function isServerlessRuntime() {
  const execEnv = process.env.AWS_EXECUTION_ENV || "";
  return Boolean(
    process.env.VERCEL ||
      process.env.AWS_LAMBDA_FUNCTION_NAME ||
      process.env.LAMBDA_TASK_ROOT ||
      execEnv.toLowerCase().includes("lambda")
  );
}

export function getStorageRoot() {
  const configuredPath = process.env.LOCAL_STORAGE_PATH?.trim();
  if (configuredPath) {
    return configuredPath;
  }
  if (isServerlessRuntime()) {
    return path.join(os.tmpdir(), "storage");
  }
  return path.join(process.cwd(), "storage");
}

export function getStorageDriver() {
  const configuredDriver = process.env.STORAGE_DRIVER?.trim().toLowerCase();
  if (configuredDriver === "s3") {
    return "s3";
  }
  if (configuredDriver === "local") {
    return "local";
  }
  return hasS3EnvConfig() ? "s3" : "local";
}

export function getS3Client() {
  const region = process.env.S3_REGION;
  const bucket = process.env.S3_BUCKET;
  const accessKeyId = process.env.S3_ACCESS_KEY_ID;
  const secretAccessKey = process.env.S3_SECRET_ACCESS_KEY;
  if (!region || !bucket || !accessKeyId || !secretAccessKey) {
    throw new Error("S3 env belum lengkap.");
  }
  const endpoint = process.env.S3_ENDPOINT;
  const forcePathStyle = process.env.S3_FORCE_PATH_STYLE === "true";
  return new S3Client({
    region,
    endpoint,
    forcePathStyle,
    credentials: {
      accessKeyId,
      secretAccessKey,
    },
  });
}

export function getS3Bucket() {
  const bucket = process.env.S3_BUCKET;
  if (!bucket) throw new Error("S3_BUCKET belum diset.");
  return bucket;
}

export async function ensureDir(dir: string) {
  await fs.mkdir(dir, { recursive: true });
}

export async function saveFile(relativePath: string, buffer: Buffer) {
  if (getStorageDriver() === "s3") {
    const client = getS3Client();
    await client.send(
      new PutObjectCommand({
        Bucket: getS3Bucket(),
        Key: relativePath.replace(/\\/g, "/"),
        Body: buffer,
      })
    );
    return relativePath;
  }

  const fullPath = path.join(getStorageRoot(), relativePath);
  await ensureDir(path.dirname(fullPath));
  await fs.writeFile(fullPath, buffer);
  return fullPath;
}

export async function readFileBuffer(relativePath: string) {
  if (getStorageDriver() === "s3") {
    const client = getS3Client();
    const result = await client.send(
      new GetObjectCommand({
        Bucket: getS3Bucket(),
        Key: relativePath.replace(/\\/g, "/"),
      })
    );
    const body = result.Body;
    if (!body || typeof body === "string") {
      throw new Error("Gagal membaca file dari S3.");
    }
    const chunks: Buffer[] = [];
    for await (const chunk of body as AsyncIterable<Uint8Array>) {
      chunks.push(Buffer.from(chunk));
    }
    return Buffer.concat(chunks);
  }

  const fullPath = path.join(getStorageRoot(), relativePath);
  return fs.readFile(fullPath);
}

export function createFileStream(relativePath: string) {
  const fullPath = path.join(getStorageRoot(), relativePath);
  return createReadStream(fullPath);
}

export function resolveStoragePath(relativePath: string) {
  return path.join(getStorageRoot(), relativePath);
}
