/**
 * Local filesystem storage
 * Replaces Forge/S3 with local ./uploads/ directory
 */
import path from "path";
import fs from "fs";

const UPLOADS_DIR = path.join(process.cwd(), "uploads");

function ensureUploadsDir() {
  if (!fs.existsSync(UPLOADS_DIR)) {
    fs.mkdirSync(UPLOADS_DIR, { recursive: true });
  }
}

export async function storagePut(
  relKey: string,
  data: Buffer | Uint8Array | string,
  _contentType = "application/octet-stream"
): Promise<{ key: string; url: string }> {
  ensureUploadsDir();
  const key = relKey.replace(/^\/+/, "");
  const filePath = path.join(UPLOADS_DIR, key);

  // Ensure subdirectories exist
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  if (typeof data === "string") {
    fs.writeFileSync(filePath, data, "utf-8");
  } else {
    fs.writeFileSync(filePath, data);
  }

  const url = `/uploads/${key}`;
  return { key, url };
}

export async function storageGet(relKey: string): Promise<{ key: string; url: string }> {
  const key = relKey.replace(/^\/+/, "");
  return {
    key,
    url: `/uploads/${key}`,
  };
}
