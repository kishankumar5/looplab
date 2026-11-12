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

## Deployment

LoopLab deploys to **Vercel** with a **Neon** Postgres database.

| Environment | When | Database |
|---|---|---|
| Production | Every push to `main` | Neon main branch |
| Preview | Every pull request (Vercel comments the URL on the PR) | Its own Neon branch, created by the Neon integration |

**Production URL:** https://looplab-sand.vercel.app

How it's wired:
1. The Vercel project imports this repo; Vercel's GitHub app builds every PR and every push to `main`.
2. The Neon integration (Vercel > Storage > Neon) sets `DATABASE_URL` for Production and gives each Preview deployment its own database branch.
3. `AUTH_SECRET` is set by hand in Vercel's environment variables, separately for Production and Preview.
4. Vercel runs `npm run vercel-build` (`prisma migrate deploy && next build`), so every deploy applies pending migrations before building.
5. GitHub Actions CI (lint, tests, build, E2E) runs on the same PRs, independent of Vercel.

