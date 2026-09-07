import "server-only";
import path from "node:path";
import { mkdir, writeFile, readFile, unlink } from "node:fs/promises";
import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
} from "@aws-sdk/client-s3";

// Base folder for local disk storage (statically scoped to prevent Turbopack whole-project tracing)
const LOCAL_STORAGE_ROOT = path.join(process.cwd(), "storage", "uploads");

function getStorageDriverType(): "r2" | "local" {
  if (process.env.STORAGE_DRIVER === "r2") return "r2";
  if (process.env.STORAGE_DRIVER === "local") return "local";

  // Auto-detect R2 if credentials are provided, otherwise fallback to local
  if (process.env.R2_BUCKET_NAME && process.env.R2_ACCESS_KEY_ID && process.env.R2_SECRET_ACCESS_KEY) {
    return "r2";
  }
  return "local";
}

let s3ClientInstance: S3Client | null = null;

function getS3Client(): S3Client {
  if (s3ClientInstance) return s3ClientInstance;

  const accountId = process.env.R2_ACCOUNT_ID;
  const accessKeyId = process.env.R2_ACCESS_KEY_ID;
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
  const customEndpoint = process.env.R2_ENDPOINT;

  const endpoint = customEndpoint || (accountId ? `https://${accountId}.r2.cloudflarestorage.com` : undefined);

  if (!endpoint || !accessKeyId || !secretAccessKey) {
    throw new Error(
      "Cloudflare R2 storage driver requires R2_ACCOUNT_ID (or R2_ENDPOINT), R2_ACCESS_KEY_ID, and R2_SECRET_ACCESS_KEY."
    );
  }

  s3ClientInstance = new S3Client({
    region: "auto",
    endpoint,
    credentials: {
      accessKeyId,
      secretAccessKey,
    },
  });

  return s3ClientInstance;
}

function resolveLocalPath(storageKey: string): string {
  // Normalize key by stripping leading storage/uploads prefix if stored as full relative path
  const normalized = storageKey
    .replace(/\\/g, "/")
    .replace(/^(\/?storage\/uploads\/?)/, "")
    .replace(/^\/+/, "");
  return path.join(LOCAL_STORAGE_ROOT, normalized);
}

/**
 * Uploads file bytes to either Cloudflare R2 or local disk storage.
 * Returns the canonical storageKey to record in the database.
 */
export async function uploadFile(
  storageKey: string,
  bytes: Buffer,
  mimeType: string
): Promise<string> {
  const driver = getStorageDriverType();

  if (driver === "r2") {
    const bucket = process.env.R2_BUCKET_NAME;
    if (!bucket) {
      throw new Error("R2_BUCKET_NAME environment variable is required for R2 storage driver.");
    }

    const client = getS3Client();
    await client.send(
      new PutObjectCommand({
        Bucket: bucket,
        Key: storageKey.replace(/\\/g, "/"),
        Body: bytes,
        ContentType: mimeType,
      })
    );
    return storageKey;
  }

  // Local filesystem fallback
  const localDest = resolveLocalPath(storageKey);
  await mkdir(path.dirname(localDest), { recursive: true });
  await writeFile(localDest, bytes);
  return storageKey;
}

/**
 * Retrieves file buffer by its storageKey from Cloudflare R2 or local disk storage.
 */
export async function downloadFile(storageKey: string): Promise<Buffer> {
  const driver = getStorageDriverType();

  if (driver === "r2") {
    const bucket = process.env.R2_BUCKET_NAME;
    if (!bucket) {
      throw new Error("R2_BUCKET_NAME environment variable is required for R2 storage driver.");
    }

    const client = getS3Client();
    const res = await client.send(
      new GetObjectCommand({
        Bucket: bucket,
        Key: storageKey.replace(/\\/g, "/"),
      })
    );

    if (!res.Body) {
      throw new Error(`File "${storageKey}" not found in R2 storage.`);
    }

    // Convert stream to Buffer
    const byteArray = await res.Body.transformToByteArray();
    return Buffer.from(byteArray);
  }

  // Local filesystem fallback
  const localSrc = resolveLocalPath(storageKey);
  return await readFile(localSrc);
}

/**
 * Deletes file by its storageKey from Cloudflare R2 or local disk storage.
 */
export async function deleteFile(storageKey: string): Promise<void> {
  const driver = getStorageDriverType();

  if (driver === "r2") {
    const bucket = process.env.R2_BUCKET_NAME;
    if (!bucket) return;

    try {
      const client = getS3Client();
      await client.send(
        new DeleteObjectCommand({
          Bucket: bucket,
          Key: storageKey.replace(/\\/g, "/"),
        })
      );
    } catch (e) {
      console.warn(`Failed to delete object "${storageKey}" from R2:`, e);
    }
    return;
  }

  // Local filesystem fallback
  try {
    const localSrc = resolveLocalPath(storageKey);
    await unlink(localSrc);
  } catch {
    /* file may not exist, skip */
  }
}

export function isCloudStorage(): boolean {
  return getStorageDriverType() === "r2";
}
