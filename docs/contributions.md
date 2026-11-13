# Partner contribution log

Who built, reviewed, and set up what, taken from the GitHub history (PR authors, approvals, and issue owners).
Both partners used Claude Code with the shared rules in [`CLAUDE.md`](../CLAUDE.md); every PR was reviewed and approved by the other partner before merging.

_Last updated: Fri Nov 13, 2026. PRs still in review are marked._

## Summary

| | Kishan Kumar Selvakumar Anandraj | Nicholas Kaplun |
|---|---|---|
| **Issues delivered** | #5, #6, #8 (editor half), #9, #11, #12, #16 | #1, #2, #3, #4, #7, #8 (API + My Beats half), #10, #13, #14, #15, #17 (diagrams, README) |
| **PRs authored** | 8 (#34 to #41) | 18 (#20 to #33, #51 to #54) |
| **PRs reviewed and approved** | 11 (#20 to #22, #24 to #31) | 8 (#34 to #41) |
| **Infrastructure** | Vercel project, Neon database with per-PR preview branches, production `AUTH_SECRET`, security scanning, Dependabot | Test tooling and 4-stage CI, Prisma schema and migrations, Auth.js, OpenAPI spec and `/api-docs` |

## By feature

| Issue | Feature | Built by | PR | Reviewed by |
|---|---|---|---|---|
| #1 | Test tooling (Vitest, Playwright) and the CI pipeline | Nicholas | #22 | Kishan |
| #2 | Deploy setup: env vars, migrations on deploy, production URL | Nicholas (code), Kishan (Vercel + Neon) | #26, #31 | Kishan |
| #3 | Postgres + Prisma schema for users, beats, likes | Nicholas | #24 | Kishan |
| #4 | Register, sign in, sign out (Auth.js, JWT) | Nicholas | #25 | Kishan |
| #5 | 5x16 step grid | Kishan | #34 | Nicholas |
| #6 | Play/stop, tempo, moving playhead (Tone.js) | Kishan | #35 | Nicholas |
| #7 | Muffle and vinyl crackle | Nicholas | #51 (in review) | Kishan |
| #8 | Save, rename, delete; My Beats; save from the editor | Nicholas (API, My Beats), Kishan (editor + `/beats/{id}`) | #30, #38 | Kishan, Nicholas |
| #9 | Public/private toggle and listen-only share page | Kishan | #40 | Nicholas |
| #10 | Swing | Nicholas | #54 (in review) | Kishan |
| #11 | Per-row volume and mute, with a limiter | Kishan | #41 | Nicholas |
| #12 | Undo and redo | Kishan | #36 | Nicholas |
| #13 | Gallery, likes, and preview play on cards | Nicholas | #27, #52 (in review) | Kishan |
| #14 | Remix with credit to the original | Nicholas | #32 (in review) | Kishan |
| #15 | OpenAPI spec and Swagger docs | Nicholas | #28 | Kishan |
| #16 | Security scanning in CI (CodeQL, npm audit, dependency review) | Kishan | #37 | Nicholas |
| #17 | Architecture and database diagrams, README, sprint docs, this log | Nicholas (diagrams, README, sprint templates, this log), Kishan (sprint 2 plan) | #23, #29, #39, #53 (in review) | Kishan, Nicholas |

## Not built

| Issue | Feature | Why |
|---|---|---|
| #18 | Live jam rooms | Stretch goal, out of scope from the start (real-time sync was the riskiest part) |
| #19 | WAV export | Stretch goal |

## How we worked

- **Planning:** issues with acceptance criteria on the [project board](https://github.com/users/kishankumar5/projects/1), split by points at each sprint planning. See [`docs/sprints/`](sprints/).
- **TDD:** every feature PR has a failing-test commit (with stubs that throw "not implemented") before the implementation commit.
- **Reviews:** the other partner reviewed and approved every PR. Reviews checked the acceptance criteria, the TDD commit order, and access rules, not just green CI.
- **What we'd change:** in Sprint 1 I stacked PRs on top of each other, which made them slow to review and merge. In Sprint 2 we opened PRs against `main` and merged as we went. See the [Sprint 1 retro](sprints/sprint-1/retro.md).
