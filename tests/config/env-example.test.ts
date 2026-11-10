// @vitest-environment node
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const ROOT = join(__dirname, "..", "..");

function sourceFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    if (name === "generated" || name === "node_modules") return [];
    if (statSync(path).isDirectory()) return sourceFiles(path);
    return /\.(ts|tsx)$/.test(name) ? [path] : [];
  });
}

function envVarsUsedIn(files: string[]): Set<string> {
  const used = new Set<string>();
  for (const file of files) {
    for (const match of readFileSync(file, "utf8").matchAll(/process\.env(?:\.|\[")([A-Z][A-Z0-9_]*)/g)) {
      used.add(match[1]);
    }
  }
  return used;
}

describe(".env.example (issue #2)", () => {
  const example = readFileSync(join(ROOT, ".env.example"), "utf8");
  const declared = new Set([...example.matchAll(/^([A-Z][A-Z0-9_]*)=/gm)].map((m) => m[1]));

  it("declares every environment variable the app and tests read", () => {
    const files = [...sourceFiles(join(ROOT, "src")), ...sourceFiles(join(ROOT, "tests")), join(ROOT, "prisma.config.ts")];
    const ignored = new Set(["NODE_ENV", "CI", "E2E_BASE_URL"]); // set by tools, not by us
    const missing = [...envVarsUsedIn(files)].filter((name) => !ignored.has(name) && !declared.has(name));
    expect(missing).toEqual([]);
  });

  it("contains no real secrets", () => {
    expect(example).not.toMatch(/postgres(ql)?:\/\/[^\s"]*neon\.tech/);
    expect(example).toMatch(/^AUTH_SECRET=""?$/m);
  });
});
