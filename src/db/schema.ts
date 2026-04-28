import { pgTable, uuid, varchar, integer, timestamp } from "drizzle-orm/pg-core";

export const images = pgTable("image", {
  id: uuid("id").primaryKey().defaultRandom(),
  slug: varchar("slug", { length: 16 }).notNull().unique(),
  blobKey: varchar("blob_key", { length: 128 }).notNull(),
  contentType: varchar("content_type", { length: 64 }).notNull(),
  sizeBytes: integer("size_bytes").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});
