import { promises as fs } from "node:fs";
import path from "node:path";
import process from "node:process";
import { neon } from "@neondatabase/serverless";

async function loadLocalEnvironment() {
  if (process.env.DATABASE_URL) return;

  for (const filename of [".env.local", ".env"]) {
    try {
      process.loadEnvFile(path.join(process.cwd(), filename));
      if (process.env.DATABASE_URL) return;
    } catch (error) {
      if (error?.code !== "ENOENT") throw error;
    }
  }
}

await loadLocalEnvironment();

if (!process.env.DATABASE_URL) {
  console.error(
    "DATABASE_URL is missing. Add the Neon connection string to .env.local, then run this command again.",
  );
  process.exit(1);
}

const sql = neon(process.env.DATABASE_URL);
const migrationPath = path.join(
  process.cwd(),
  "db",
  "001_create_kanji_meanings.sql",
);
const dataPath = path.join(process.cwd(), "data", "custom-meanings.json");

const migration = await fs.readFile(migrationPath, "utf8");
const statements = migration
  .split(";")
  .map((statement) => statement.trim())
  .filter(Boolean);
for (const statement of statements) {
  await sql.query(statement);
}

const store = JSON.parse(await fs.readFile(dataPath, "utf8"));
const entries = Object.entries(store).flatMap(([kanji, meanings]) =>
  meanings.map((entry) => ({ kanji, ...entry })),
);

let added = 0;
for (const entry of entries) {
  const inserted = await sql`
    INSERT INTO kanji_meanings (kanji, word, reading, meaning)
    VALUES (${entry.kanji}, ${entry.word}, ${entry.reading}, ${entry.meaning})
    ON CONFLICT (kanji, word, reading) DO NOTHING
    RETURNING id
  `;
  added += inserted.length;
}

console.log(
  `Database ready. Found ${entries.length} JSON entries; inserted ${added}.`,
);
