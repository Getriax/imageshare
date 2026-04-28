CREATE TABLE IF NOT EXISTS "image" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "slug" varchar(16) UNIQUE NOT NULL,
  "blob_key" varchar(128) NOT NULL,
  "content_type" varchar(64) NOT NULL,
  "size_bytes" integer NOT NULL,
  "created_at" timestamptz DEFAULT now() NOT NULL
);
