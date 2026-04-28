import { Hono } from "hono";
import { sql } from "drizzle-orm";
import { getDb } from "../db/client.js";
import { headStorage, ensureUploadDir } from "../blob/storage.js";

const app = new Hono();

app.get("/health", async (c) => {
  let dbOk = false;
  let blobOk = false;

  try {
    const db = getDb();
    await db.execute(sql`SELECT 1`);
    dbOk = true;
  } catch {}

  try {
    await ensureUploadDir();
    blobOk = await headStorage();
  } catch {}

  const ok = dbOk && blobOk;
  return c.json({ ok, db: dbOk, blob: blobOk }, ok ? 200 : 503);
});

export default app;
