import { neon } from "@neondatabase/serverless";

let database: ReturnType<typeof neon> | null = null;

export function getDatabase() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error("DATABASE_URL is not configured.");
  }

  if (!database) database = neon(databaseUrl);
  return database;
}
