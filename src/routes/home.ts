import { Hono } from "hono";
import { html } from "hono/html";
import { stream } from "hono/streaming";
import { getDb } from "../db/client.js";
import { images } from "../db/schema.js";
import { eq } from "drizzle-orm";
import { getEnv } from "../env.js";
import { generateSlug } from "../util/slug.js";
import { putImage } from "../blob/s3.js";
import { GetObjectCommand } from "@aws-sdk/client-s3";
import { getS3Client } from "../blob/s3.js";

const app = new Hono();

const ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);
const MAX_SIZE = 10 * 1024 * 1024; // 10 MiB

function extForType(ct: string): string {
  switch (ct) {
    case "image/jpeg": return "jpg";
    case "image/png": return "png";
    case "image/webp": return "webp";
    case "image/gif": return "gif";
    default: return "bin";
  }
}

// GET / — upload form
app.get("/", (c) => {
  return c.html(html`<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8"><title>ImageShare</title></head>
<body>
  <h1>ImageShare</h1>
  <form method="post" action="/upload" enctype="multipart/form-data">
    <input type="file" name="image" accept="image/*">
    <button type="submit">Upload</button>
  </form>
</body>
</html>`);
});

// POST /upload
app.post("/upload", async (c) => {
  const body = await c.req.parseBody();
  const file = body["image"];

  if (!file || !(file instanceof File)) {
    return c.text("Missing image field", 400);
  }

  const contentType = file.type;
  if (!ALLOWED_TYPES.has(contentType)) {
    return c.text("Unsupported media type", 415);
  }

  const arrayBuf = await file.arrayBuffer();
  if (arrayBuf.byteLength > MAX_SIZE) {
    return c.text("Payload too large", 413);
  }

  const buffer = Buffer.from(arrayBuf);
  const ext = extForType(contentType);
  const db = getDb();

  let slug = "";
  let inserted = false;
  for (let attempt = 0; attempt < 3; attempt++) {
    slug = generateSlug();
    const blobKey = `${slug}.${ext}`;
    try {
      await putImage(blobKey, buffer, contentType);
      await db.insert(images).values({
        slug,
        blobKey,
        contentType,
        sizeBytes: buffer.length,
      });
      inserted = true;
      break;
    } catch (err: any) {
      // If it's a unique violation, retry
      if (err?.code === "23505") {
        continue;
      }
      throw err;
    }
  }

  if (!inserted) {
    return c.text("Failed to generate unique slug", 500);
  }

  return c.redirect(`/i/${slug}`);
});

// GET /i/:slug — share page
app.get("/i/:slug", async (c) => {
  const slug = c.req.param("slug");
  const db = getDb();
  const rows = await db.select().from(images).where(eq(images.slug, slug)).limit(1);
  const row = rows[0];
  if (!row) {
    return c.text("Not found", 404);
  }

  const env = getEnv();
  const shareUrl = `${env.APP_BASE_URL}/raw/${slug}`;

  return c.html(html`<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8"><title>ImageShare — ${slug}</title></head>
<body>
  <h1>Shared Image</h1>
  <img src="/raw/${slug}" alt="shared image">
  <p>Share URL: <input type="text" readonly value="${shareUrl}" onclick="this.select()"></p>
</body>
</html>`);
});

// GET /raw/:slug — redirect to S3 (public bucket)
app.get("/raw/:slug", async (c) => {
  const slug = c.req.param("slug");
  const db = getDb();
  const rows = await db.select().from(images).where(eq(images.slug, slug)).limit(1);
  const row = rows[0];
  if (!row) {
    return c.text("Not found", 404);
  }

  const env = getEnv();
  // Public bucket: redirect directly to the object URL
  const url = `${env.S3_ENDPOINT}/${env.S3_BUCKET}/${row.blobKey}`;
  return c.redirect(url, 302);
});

export default app;
