import { Hono } from "hono";
import homeRoutes from "./routes/home.js";
import healthRoutes from "./routes/health.js";
import { getEnv } from "./env.js";
import { ensureBucket } from "./blob/s3.js";
import { getDb } from "./db/client.js";
import { sql } from "drizzle-orm";

const app = new Hono();

app.route("/", homeRoutes);
app.route("/", healthRoutes);

const env = getEnv();

console.log(`ImageShare starting on port ${env.PORT}`);

// Run migrations and ensure bucket on startup
async function bootstrap() {
  const db = getDb();

  // Enable uuid extension
  await db.execute(sql`CREATE EXTENSION IF NOT EXISTS "pgcrypto";`);

  // Create table if not exists
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS "image" (
      "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      "slug" varchar(16) UNIQUE NOT NULL,
      "blob_key" varchar(128) NOT NULL,
      "content_type" varchar(64) NOT NULL,
      "size_bytes" integer NOT NULL,
      "created_at" timestamptz DEFAULT now() NOT NULL
    );
  `);
  console.log("Database migration ensured");

  // Ensure bucket exists
  await ensureBucket();
  console.log("Bucket ensured");
}

bootstrap()
  .then(() => console.log("Bootstrap complete"))
  .catch((e) => {
    console.error("Bootstrap failed:", e?.message || e);
  });

import { serve } from "@hono/node-server";
serve({ fetch: app.fetch, port: env.PORT });

export default app;
