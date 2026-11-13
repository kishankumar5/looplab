// @vitest-environment node
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const ROOT = join(__dirname, "..", "..");
const workflow = readFileSync(join(ROOT, ".github/workflows/ci.yml"), "utf8");

/** Each job's YAML text, keyed by job id (the keys indented two spaces under `jobs:`). */
function jobBlocks(yaml: string): Map<string, string> {
  const jobsSection = yaml.slice(yaml.search(/^jobs:\s*$/m));
  const parts = jobsSection.split(/^ {2}(?=[\w-]+:\s*$)/m).slice(1);
  return new Map(parts.map((part) => [part.slice(0, part.indexOf(":")), part]));
}

const jobs = jobBlocks(workflow);

/** The id of the one job matching `pattern`; fails the test if there is none. */
function jobMatching(pattern: RegExp, description: string): string {
  const found = [...jobs].find(([, block]) => pattern.test(block));
  if (!found) throw new Error(`No CI job ${description}`);
  return found[0];
}

const codeqlJob = () => jobMatching(/uses: github\/codeql-action\/analyze@/, "runs CodeQL");
const auditJob = () => jobMatching(/run: npm audit\b/, "runs npm audit");
const reviewJob = () => jobMatching(/uses: actions\/dependency-review-action@/, "runs dependency review");

describe("CI security scanning (issue #16)", () => {
  it("runs CI on every pull request and on pushes to main", () => {
    expect(workflow).toMatch(/^on:\s*\n(?: {2}.*\n)*? {2}pull_request:/m);
    expect(workflow).toMatch(/^ {2}push:\s*\n {4}branches: \[main\]/m);
  });

  it("analyzes the JavaScript and TypeScript code with CodeQL and uploads the results", () => {
    const block = jobs.get(codeqlJob()) ?? "";
    expect(block).toMatch(/uses: github\/codeql-action\/init@/);
    expect(block).toMatch(/languages: javascript-typescript/);
    expect(block).toMatch(/security-events: write/);
  });

  it("fails the build on high or critical npm vulnerabilities", () => {
    const block = jobs.get(auditJob()) ?? "";
    expect(block).toMatch(/run: npm audit --audit-level=high\s*$/m);
    expect(block).not.toMatch(/continue-on-error: true/);
  });

  it("reviews the dependencies each pull request adds", () => {
    const block = jobs.get(reviewJob()) ?? "";
    expect(block).toMatch(/if: github\.event_name == 'pull_request'/);
  });

  it("runs the scans alongside the other stages without holding them up", () => {
    const security = [codeqlJob(), auditJob(), reviewJob()];
    for (const id of security) expect(jobs.get(id), id).not.toMatch(/^ {4}needs:/m);
    for (const [id, block] of jobs) {
      if (security.includes(id)) continue;
      const needs = block.match(/^ {4}needs: (.*)$/m)?.[1] ?? "";
      for (const scan of security) expect(needs, `${id} must not wait for ${scan}`).not.toMatch(new RegExp(`\\b${scan}\\b`));
    }
  });

  it("has Dependabot keep npm packages and GitHub Actions up to date", () => {
    const path = join(ROOT, ".github/dependabot.yml");
    expect(existsSync(path), ".github/dependabot.yml should exist").toBe(true);
    const config = readFileSync(path, "utf8");
    expect(config).toMatch(/package-ecosystem: "?npm"?\s*$/m);
    expect(config).toMatch(/package-ecosystem: "?github-actions"?\s*$/m);
  });
});
