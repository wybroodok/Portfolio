// Local embedded PostgreSQL for development.
// Runs a real Postgres server from your user account — no Docker, no root.
// Data lives in ./.pgdata (git-ignored). Ctrl+C stops it cleanly.
import { existsSync } from "node:fs";
import { join } from "node:path";
import EmbeddedPostgres from "embedded-postgres";

const DATA_DIR = join(process.cwd(), ".pgdata");
const PORT = 5432;
const DB_NAME = "kinetik";

const pg = new EmbeddedPostgres({
  databaseDir: DATA_DIR,
  user: "postgres",
  password: "postgres",
  port: PORT,
  persistent: true, // keep data between restarts
});

// initdb only on first ever run (when the cluster doesn't exist yet).
if (!existsSync(join(DATA_DIR, "PG_VERSION"))) {
  console.log("• Initialising Postgres cluster in ./.pgdata (one-time)…");
  await pg.initialise();
}

console.log(`• Starting Postgres on port ${PORT}…`);
await pg.start();

// Make sure the app database exists (createDatabase throws if it already does).
try {
  await pg.createDatabase(DB_NAME);
  console.log(`• Created database "${DB_NAME}".`);
} catch {
  /* already exists — fine */
}

console.log(`✔ Postgres ready → postgresql://postgres:postgres@localhost:${PORT}/${DB_NAME}`);

async function shutdown() {
  console.log("\n• Stopping Postgres…");
  try {
    await pg.stop();
  } finally {
    process.exit(0);
  }
}
process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
