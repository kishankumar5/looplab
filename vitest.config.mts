import { fileURLToPath } from "node:url";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) },
  },
  test: {
    environment: "jsdom",
    setupFiles: ["./vitest.setup.ts"],
    globalSetup: ["./tests/integration/global-setup.ts"],
    // Integration tests share one test database, so run files one at a time.
    fileParallelism: false,
    include: ["src/**/*.test.{ts,tsx}", "tests/integration/**/*.test.ts", "tests/config/**/*.test.ts"],
    coverage: {
      provider: "v8",
      include: ["src/lib/**/*.ts"],
      // auth/index.ts only wires ./callbacks into Auth.js; it is covered by tests/e2e/auth.spec.ts.
      exclude: ["src/lib/**/*.test.ts", "src/lib/auth/index.ts"],
      reporter: ["text", "html", "json-summary"],
      // CLAUDE.md testing strategy: 80%+ line coverage for src/lib, enforced in CI
      thresholds: { lines: 80 },
    },
  },
});
