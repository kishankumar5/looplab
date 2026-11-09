import { execSync } from "node:child_process";
import "dotenv/config";

/** Applies all migrations to the test database before integration tests run. */
export default function setup() {
  const url = process.env.DATABASE_URL_TEST;
  if (!url) return;
  execSync("npx prisma migrate deploy", { stdio: "inherit", env: { ...process.env, DATABASE_URL: url } });
}
