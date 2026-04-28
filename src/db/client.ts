import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { getEnv } from "../env.js";
import * as schema from "./schema.js";

let _db: ReturnType<typeof drizzle> | undefined;

export function getDb() {
  if (!_db) {
    const env = getEnv();
    const client = postgres(env.DATABASE_URL);
    _db = drizzle(client, { schema });
  }
  return _db;
}
