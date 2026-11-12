# LoopLab

A browser-based lo-fi beat maker. Toggle steps on a 16-step grid, add lo-fi effects (muffle, vinyl crackle, swing), save beats, share them by link, and remix other people's beats.

CS6983 AI Coding, Fall 2026, Project 2. Team: Kishan Kumar Selvakumar Anandraj and Nicholas Kaplun.

| Doc | What's in it |
|---|---|
| [docs/PRD.md](docs/PRD.md) | Requirements, user stories, acceptance criteria, data model, API |
| [docs/mockup/index.html](docs/mockup/index.html) | Clickable mockup of every screen (open in a browser) |
| [CLAUDE.md](CLAUDE.md) | Shared AI rules file: stack, architecture, conventions, workflow |

## Run locally

```bash
npm install
npm run dev   # http://localhost:3000
```

### Local database (needed for integration tests and, later, accounts and saving)

LoopLab uses PostgreSQL through Prisma. Locally, run Postgres in Docker:

```bash
docker run -d --name looplab-db -e POSTGRES_USER=looplab -e POSTGRES_PASSWORD=looplab \
  -e POSTGRES_DB=looplab -p 5433:5432 postgres:17
docker exec looplab-db psql -U looplab -c "CREATE DATABASE looplab_test;"
```

Then copy `.env.example` to `.env` (git-ignored) and set `AUTH_SECRET` (`openssl rand -base64 32`).

and apply the schema: `npm run db:migrate`. `npm test` applies migrations to the test database on its own; without `DATABASE_URL_TEST`, the integration tests are skipped.

### Tests

| Command | What it runs |
|---|---|
| `npm test` | Unit + integration tests (Vitest) |
| `npm run test:coverage` | Same, with the 80% coverage gate on `src/lib` |
| `npm run test:e2e` | Browser tests (Playwright) |
| `npm run lint` / `npm run typecheck` | ESLint / TypeScript |

Setup, deployment, API docs, and architecture diagrams will be added during Sprint 1 and 2.

## CI

GitHub Actions ([`.github/workflows/ci.yml`](.github/workflows/ci.yml)) runs on every pull request and every push to `main`:

| Job | What it checks |
|---|---|
| Lint and typecheck | `npm run lint`, `npm run typecheck` |
| Unit and integration tests | `npm run test:coverage` against a throwaway Postgres, with the 80% gate on `src/lib` |
| Production build | `npm run build` |
| E2E tests | Playwright against the production build |
| Security: CodeQL | Static analysis of the JavaScript/TypeScript code; findings appear in the repo's **Security** tab |
| Security: npm audit | `npm audit --audit-level=high`: fails on high or critical vulnerabilities in any dependency |
| Security: dependency review | Pull requests only: fails if the PR adds a dependency with a high or critical vulnerability |

The first four jobs run in that order; the security scans run in parallel with them, so they don't slow them down. Run the audit locally with `npm audit --audit-level=high`.

[Dependabot](.github/dependabot.yml) opens weekly pull requests to update npm packages (minor and patch updates grouped into one PR) and the GitHub Actions the workflow uses. They go through the same CI and review as any other PR.

## Deployment

LoopLab deploys to **Vercel** with a **Neon** Postgres database.

| Environment | When | Database |
|---|---|---|
| Production | Every push to `main` | Neon main branch |
| Preview | Every pull request (Vercel comments the URL on the PR) | Its own Neon branch, created by the Neon integration |

**Production URL:** _added once Vercel is connected_

How it's wired:
1. The Vercel project imports this repo; Vercel's GitHub app builds every PR and every push to `main`.
2. The Neon integration (Vercel > Storage > Neon) sets `DATABASE_URL` for Production and gives each Preview deployment its own database branch.
3. `AUTH_SECRET` is set by hand in Vercel's environment variables, separately for Production and Preview.
4. Vercel runs `npm run vercel-build` (`prisma migrate deploy && next build`), so every deploy applies pending migrations before building.
5. GitHub Actions CI (lint, tests, build, E2E, security scans; see [CI](#ci)) runs on the same PRs, independent of Vercel.

