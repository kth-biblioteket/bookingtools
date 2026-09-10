import { execFileSync } from "node:child_process";
import { existsSync, unlinkSync } from "node:fs";
import path from "node:path";

const TEST_DB_PATH = path.resolve(__dirname, "../prisma/test.db");
const TEST_DATABASE_URL = `file:${TEST_DB_PATH}`;

function removeIfExists(filePath: string) {
  if (existsSync(filePath)) {
    unlinkSync(filePath);
  }
}

export default async function globalSetup() {
  // Start from a clean slate: remove any leftover test database files.
  removeIfExists(TEST_DB_PATH);
  removeIfExists(`${TEST_DB_PATH}-journal`);
  removeIfExists(`${TEST_DB_PATH}-wal`);
  removeIfExists(`${TEST_DB_PATH}-shm`);

  const env = {
    ...process.env,
    DATABASE_URL: TEST_DATABASE_URL,
  };

  // Apply migrations to the isolated test database only.
  execFileSync("npx", ["prisma", "migrate", "deploy"], {
    cwd: path.resolve(__dirname, ".."),
    env,
    stdio: "inherit",
  });

  // Seed the test database with a small, known set of rooms.
  execFileSync("npx", ["tsx", "e2e/seed-test-db.ts"], {
    cwd: path.resolve(__dirname, ".."),
    env,
    stdio: "inherit",
  });
}
