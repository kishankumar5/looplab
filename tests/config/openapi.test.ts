// @vitest-environment node
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative, sep } from "node:path";
import { describe, expect, it } from "vitest";
import { parse } from "yaml";

const ROOT = join(__dirname, "..", "..");
const API_DIR = join(ROOT, "src", "app", "api");
const METHODS = ["GET", "POST", "PUT", "PATCH", "DELETE"] as const;

type Operation = { responses?: Record<string, { content?: Record<string, { schema?: { $ref?: string } }> }> };
type Spec = {
  openapi: string;
  info: { title: string; version: string };
  paths: Record<string, Partial<Record<Lowercase<(typeof METHODS)[number]>, Operation>> & { "x-managed-by"?: string }>;
  components?: { schemas?: Record<string, unknown> };
};

const spec = parse(readFileSync(join(ROOT, "docs", "openapi.yaml"), "utf8")) as Spec;

/** Every route.ts under src/app/api as { path: "/api/beats/{id}/like", methods: ["POST", "DELETE"] }. */
function codeRoutes(dir = API_DIR): { path: string; methods: string[] }[] {
  return readdirSync(dir).flatMap((name) => {
    const full = join(dir, name);
    if (statSync(full).isDirectory()) return codeRoutes(full);
    if (name !== "route.ts") return [];
    const folder = relative(API_DIR, dir).split(sep).filter(Boolean);
    if (folder.some((part) => part.startsWith("[..."))) return []; // Auth.js catch-all: documented by hand below
    const path = "/api/" + folder.map((part) => part.replace(/^\[(.+)\]$/, "{$1}")).join("/");
    const source = readFileSync(full, "utf8");
    const methods = METHODS.filter((m) => new RegExp(`export (async function|const) ${m}\\b`).test(source));
    return [{ path: path.replace(/\/$/, ""), methods }];
  });
}

describe("docs/openapi.yaml (issue #15)", () => {
  it("is OpenAPI 3.1 with a title and version", () => {
    expect(spec.openapi).toMatch(/^3\.1\./);
    expect(spec.info.title).toBe("LoopLab API");
    expect(spec.info.version).toMatch(/^\d+\.\d+\.\d+$/);
  });

  it("documents every route and method in src/app/api", () => {
    const missing = codeRoutes().flatMap(({ path, methods }) =>
      methods.filter((m) => !spec.paths[path]?.[m.toLowerCase() as Lowercase<typeof m>]).map((m) => `${m} ${path}`),
    );
    expect(missing).toEqual([]);
  });

  it("doesn't document endpoints that don't exist (except Auth.js's own)", () => {
    const inCode = new Set(codeRoutes().map((r) => r.path));
    const extra = Object.entries(spec.paths)
      .filter(([path, item]) => !inCode.has(path) && item["x-managed-by"] !== "auth.js")
      .map(([path]) => path);
    expect(extra).toEqual([]);
  });

  it("uses the shared error shape for every 4xx response", () => {
    expect(spec.components?.schemas).toHaveProperty("ErrorResponse");
    const wrong: string[] = [];
    for (const [path, item] of Object.entries(spec.paths)) {
      if (item["x-managed-by"]) continue;
      for (const method of METHODS) {
        const op = item[method.toLowerCase() as Lowercase<typeof method>];
        for (const [status, response] of Object.entries(op?.responses ?? {})) {
          const ref = response.content?.["application/json"]?.schema?.$ref;
          if (status.startsWith("4") && ref !== "#/components/schemas/ErrorResponse") wrong.push(`${method} ${path} ${status}`);
        }
      }
    }
    expect(wrong).toEqual([]);
  });
});

describe("GET /api/openapi", () => {
  it("serves the spec as YAML", async () => {
    const { GET } = await import("@/app/api/openapi/route");
    const res = await GET();
    expect(res.status).toBe(200);
    expect(res.headers.get("content-type")).toContain("yaml");
    expect(parse(await res.text())).toMatchObject({ openapi: spec.openapi, info: spec.info });
  });
});
