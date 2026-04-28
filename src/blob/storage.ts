import { promises as fs } from "node:fs";
import { join } from "node:path";
import { getEnv } from "../env.js";

const UPLOAD_DIR = "/data/uploads";

export async function ensureUploadDir(): Promise<void> {
  await fs.mkdir(UPLOAD_DIR, { recursive: true });
}

export async function putImage(key: string, body: Buffer, contentType: string): Promise<void> {
  await ensureUploadDir();
  await fs.writeFile(join(UPLOAD_DIR, key), body);
}

export async function getImage(key: string): Promise<Buffer> {
  return fs.readFile(join(UPLOAD_DIR, key));
}

export async function headStorage(): Promise<boolean> {
  try {
    await fs.access(UPLOAD_DIR);
    return true;
  } catch {
    return false;
  }
}
