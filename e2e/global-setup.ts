import { execFileSync } from "node:child_process";
import path from "node:path";

const TEST_DATABASE_URL = "postgresql://bookingtools:bookingtools@localhost:5434/bookingtools_test";

export default async function globalSetup() {
  const env = {
    ...process.env,
    DATABASE_URL: TEST_DATABASE_URL,
  };

  // Start from a clean slate and apply every migration to the isolated
  // test database only (never the dev database on the same Postgres
  // instance — see docker-compose.yml for how the two databases are kept
  // separate).
  execFileSync("npx", ["prisma", "migrate", "reset", "--force", "--skip-seed"], {
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
