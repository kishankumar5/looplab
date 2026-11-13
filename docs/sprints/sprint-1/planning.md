# Sprint 1 planning (Mon Nov 9 to Tue Nov 10, 2026)

## Planning (Nov 9, both partners)

Planned together on Nov 9 over WhatsApp: Nicholas proposed the split and order; Kishan agreed and added the working agreements below.

**Sprint goal:** a deployed app where you can build a beat on the grid, hear it with tempo, swing, and lo-fi effects, and create an account. Test tooling and CI run on every PR.

| Issue | Title | Owner | Points |
|---|---|---|---|
| #1 | Set up Vitest, Playwright, and a GitHub Actions CI pipeline | Nicholas | 3 |
| #3 | Set up Neon Postgres and the Prisma schema | Nicholas | 3 |
| #4 | Register, sign in, and sign out with email and password | Nicholas | 5 |
| #2 | Deploy to Vercel with preview deploys for every PR | Nicholas | 2 |
| #5 | Toggle steps on a 5x16 step grid | Kishan | 3 |
| #6 | Play and stop the loop with a moving playhead and tempo control | Kishan | 5 |
| #7 | Add muffle (low-pass filter) and vinyl crackle effects | Kishan | 3 |
| #10 | Add a swing control | Kishan | 2 |
| | **Total** | Nicholas 13, Kishan 13 | **26** |

**Order and dependencies**
1. #1 merges first: every other issue writes its tests first and needs the test tooling.
2. #3 before #4 (accounts need the database).
3. #5 before #6, #7, #10 (sound and effects attach to the grid's state).
4. #2 needs the database connection string for preview and production.

## Working agreements (added from Kishan's reply, Nov 9)

1. **Rules restructure (Kishan, Sprint 1):** shared rules move into `AGENTS.md`; `CLAUDE.md` becomes `@AGENTS.md` plus Claude-specific notes; UI rules move to `DESIGN.md`; add `docs/decisions/`, issue templates, and `.env.example`. Logged as rules v1.2. Nicholas avoids editing `CLAUDE.md` until it merges.
2. **One beat data shape:** Kishan's first #5 PR defines the `BeatPattern` type and its Zod schema (`src/lib/sequencer`, `src/lib/validation`). Nicholas's #3 and #8 build on that schema instead of defining their own.
3. **E2E per feature:** #1 sets up Playwright; each of us adds at least one E2E test for the main flow of our own features.
4. **Feature freeze Thursday Nov 12 at noon.** The afternoon is for the README, diagrams, demo video, and individual reflections.
5. **Reviews within about 2 hours** so nothing sits blocked in a 2-day sprint.
