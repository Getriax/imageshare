import { Hono } from "hono";
import homeRoutes from "./routes/home.js";
import healthRoutes from "./routes/health.js";
import { getEnv } from "./env.js";
import { ensureBucket } from "./blob/s3.js";

const app = new Hono();

app.route("/", homeRoutes);
app.route("/", healthRoutes);

const env = getEnv();

console.log(`ImageShare starting on port ${env.PORT}`);

// Ensure bucket exists on startup
ensureBucket()
  .then(() => console.log("Bucket ensured"))
  .catch((e) => console.warn("Bucket ensure failed:", e?.message || e));

import { serve } from "@hono/node-server";
serve({ fetch: app.fetch, port: env.PORT });

export default app;
