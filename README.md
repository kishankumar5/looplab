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

Then create a git-ignored `.env` file:

```bash
DATABASE_URL="postgresql://looplab:looplab@localhost:5433/looplab"
DATABASE_URL_TEST="postgresql://looplab:looplab@localhost:5433/looplab_test"
```

and apply the schema: `npm run db:migrate`. `npm test` applies migrations to the test database on its own; without `DATABASE_URL_TEST`, the integration tests are skipped.

### Tests

| Command | What it runs |
|---|---|
| `npm test` | Unit + integration tests (Vitest) |
| `npm run test:coverage` | Same, with the 80% coverage gate on `src/lib` |
| `npm run test:e2e` | Browser tests (Playwright) |
| `npm run lint` / `npm run typecheck` | ESLint / TypeScript |

Setup, deployment, API docs, and architecture diagrams will be added during Sprint 1 and 2.
