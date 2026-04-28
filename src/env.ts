function validateEnv() {
  const required = ["DATABASE_URL", "APP_BASE_URL"] as const;
  const missing: string[] = [];
  for (const key of required) {
    if (!process.env[key] || process.env[key]!.trim() === "") {
      missing.push(key);
    }
  }
  if (missing.length > 0) {
    throw new Error(`Missing required env vars: ${missing.join(", ")}`);
  }
  return {
    DATABASE_URL: process.env.DATABASE_URL!,
    APP_BASE_URL: process.env.APP_BASE_URL!,
    PORT: parseInt(process.env.PORT ?? "3000", 10),
  };
}

export type Env = ReturnType<typeof validateEnv>;

let _env: Env | undefined;

export function getEnv(): Env {
  if (!_env) {
    _env = validateEnv();
  }
  return _env;
}
