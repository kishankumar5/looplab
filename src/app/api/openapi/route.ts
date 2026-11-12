import { readFile } from "node:fs/promises";
import { join } from "node:path";

/** GET /api/openapi: the OpenAPI spec as YAML (read by the /api-docs page). */
export async function GET(): Promise<Response> {
  // docs/openapi.yaml is the single source of truth; next.config.ts includes it in the deployed bundle.
  const yaml = await readFile(join(process.cwd(), "docs", "openapi.yaml"), "utf8");
  return new Response(yaml, { headers: { "content-type": "application/yaml; charset=utf-8" } });
}
