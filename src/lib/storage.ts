import { promises as fs } from "fs";
import path from "path";
import { createReadStream } from "fs";
import os from "os";
import { S3Client, PutObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";

function getEnvValue(...keys: string[]) {
  for (const key of keys) {
    const raw = process.env[key];
    if (!raw) {
      continue;
    }
    const trimmed = raw.trim();
    if (!trimmed) {
      continue;
    }
    if (
      (trimmed.startsWith('"') && trimmed.endsWith('"')) ||
      (trimmed.startsWith("'") && trimmed.endsWith("'"))
    ) {
      return trimmed.slice(1, -1).trim();
    }
    return trimmed;
  }
  return "";
}

function hasS3EnvConfig() {
  const region = getEnvValue("S3_REGION", "AWS_REGION");
  const bucket = getEnvValue("S3_BUCKET");
  return Boolean(region && bucket);
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
  const configuredPath = getEnvValue("LOCAL_STORAGE_PATH");
  if (configuredPath) {
    return configuredPath;
  }
  if (isServerlessRuntime()) {
    return path.join(os.tmpdir(), "storage");
  }
  return path.join(process.cwd(), "storage");
}

export function getStorageDriver() {
  const configuredDriver = getEnvValue("STORAGE_DRIVER").toLowerCase();
  if (configuredDriver === "s3") {
    return "s3";
  }
  if (configuredDriver === "local") {
    if (isServerlessRuntime() && hasS3EnvConfig()) {
      // On serverless, prefer durable storage when config is available.
      return "s3";
    }
    return "local";
  }
  return hasS3EnvConfig() ? "s3" : "local";
}

export function getS3Client() {
  const region = getEnvValue("S3_REGION", "AWS_REGION");
  const bucket = getEnvValue("S3_BUCKET");
  const accessKeyId = getEnvValue("S3_ACCESS_KEY_ID", "AWS_ACCESS_KEY_ID");
  const secretAccessKey = getEnvValue(
    "S3_SECRET_ACCESS_KEY",
    "AWS_SECRET_ACCESS_KEY"
  );
  if (!region || !bucket) {
    throw new Error("S3 env belum lengkap.");
  }
  const endpoint = getEnvValue("S3_ENDPOINT");
  const forcePathStyle = getEnvValue("S3_FORCE_PATH_STYLE") === "true";
  const config: ConstructorParameters<typeof S3Client>[0] = {
    region,
    endpoint,
    forcePathStyle,
  };
  if (accessKeyId && secretAccessKey) {
    config.credentials = {
      accessKeyId,
      secretAccessKey,
    };
  }
  return new S3Client(config);
}

export function getS3Bucket() {
  const bucket = getEnvValue("S3_BUCKET");
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
    try {
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
    } catch (error: unknown) {
      const maybeAwsError = error as { name?: string; $metadata?: { httpStatusCode?: number } };
      if (
        maybeAwsError?.name === "NoSuchKey" ||
        maybeAwsError?.$metadata?.httpStatusCode === 404
      ) {
        const notFound = new Error("FILE_NOT_FOUND");
        (notFound as Error & { code?: string }).code = "ENOENT";
        throw notFound;
      }
      throw error;
    }
  }

  const fullPath = path.join(getStorageRoot(), relativePath);
  try {
    return await fs.readFile(fullPath);
  } catch (error: unknown) {
    const maybeFsError = error as { code?: string };
    if (maybeFsError.code === "ENOENT") {
      const notFound = new Error("FILE_NOT_FOUND");
      (notFound as Error & { code?: string }).code = "ENOENT";
      throw notFound;
    }
    throw error;
  }
}

export function createFileStream(relativePath: string) {
  const fullPath = path.join(getStorageRoot(), relativePath);
  return createReadStream(fullPath);
}

export function resolveStoragePath(relativePath: string) {
  return path.join(getStorageRoot(), relativePath);
}
