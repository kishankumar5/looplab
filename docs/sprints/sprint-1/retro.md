# Sprint 1 retrospective (Mon Nov 9 to Tue Nov 10, 2026)

## Retrospective (Tue Nov 10)

**Completed:** 0 issues closed, because no PR was reviewed or merged during the sprint.
**Built and green in CI, waiting for review:** Nicholas 4 of 4 Sprint 1 issues (#1, #3, #4, and the code half of #2), plus 3 Sprint 2 items pulled forward (#13, #15, #17 diagrams). Kishan: none of #5, #6, #7, #10 built during the sprint; connected Vercel + Neon on Tuesday evening, which unblocks #2. _(Kishan's parts added Wed Nov 11.)_

| Planned | Points | Built (PR, CI green) | Merged |
|---|---|---|---|
| Nicholas: #1, #3, #4, #2 | 13 | 13 (#2 waits on Vercel access) | 0 |
| Kishan: #5, #6, #7, #10 | 13 | 0 during the sprint (#5 and #6 built Wed Nov 11; #7 and #10 carried into Sprint 2) | 0 |

**What went well**
- Nicholas: Test-first worked well with Claude Code. Every PR has a failing-test commit before the code (the v1.1 "stubs, not missing imports" rule held up), CI caught nothing surprising, and coverage on `src/lib` stayed at 98% or more. Writing E2E tests for each feature (login, gallery, API docs) caught a real bug: Swagger UI's operations never finished loading under Turbopack.
- Kishan: Once unblocked, the setup and the first features moved fast. Vercel + Neon went in with a separate database branch for Preview deployments and AUTH_SECRET for both environments, and the first production deploy with migrations came up Ready. Our Nov 9 agreement to share one BeatPattern schema paid off: #5 and #6 imported Nicholas's schema instead of defining a second one, and both were built test-first with the stub-first red step from CLAUDE.md v1.1.

**What didn't**
- Nicholas: Nothing merged. I stacked 8 PRs on top of each other while waiting for reviews, which makes them harder to review and means one requested change can ripple through the stack. Vercel and Neon are under Kishan's account, so I couldn't finish #2 on my own. Next.js 16 surprises cost time: Cache Components needs `<Suspense>` + `connection()` around anything that reads the session, Prisma 7 needs a manual `prisma generate` after migrating, and `prisma init` silently installs AI skill files into `.claude/`.
- Kishan: I started late and didn't post standups on Monday or Tuesday, and I missed our 2-hour review window, so Nicholas's whole stack sat unreviewed and #2 waited on my Vercel setup. Reviewing the stack also taught us something: a stacked PR's base doesn't switch to `main` on its own after the PR below it merges. It only retargets once the merged branch is deleted, so #24 was still pointing at #22's branch until I deleted it.

**Partner feedback**
- Nicholas on Kishan: We agreed on the split and the 2-hour review window on Nov 9, but no reviews, pushes, or Vercel setup came through during Sprint 1, so my PRs sat unmerged and #2 waited on access only Kishan had. Next time I'd rather hear "I'm stuck" or "I'm swamped" early, so we can re-split the work before it piles up. Once Kishan picked it back up, his reviews were thorough (on #26 he caught a real risk with Neon's pooled connection URL and migrations), and the grid and audio engine he built are the heart of the demo.
- Kishan on Nicholas: Fair feedback, and I agree. I should have said early that I was behind. Your PR descriptions made reviewing fast: each lists the acceptance criteria, the TDD commits, and how you tested, so I could check them quickly. Pulling Sprint 2 work forward while blocked kept the project moving. One suggestion: opening PRs against `main` where possible, rather than stacking, would have saved us the retargeting step.

**Changes for Sprint 2** (including any CLAUDE.md rule changes)
- **Merge as we go, no more stacking:** review the existing stack (#22 → #24 → #25 → #26 → #27 → #28 → #29) first thing Wednesday, then one PR at a time.
- **If a PR waits more than 2 hours, call instead of messaging.**
- **Unblock #8:** Nicholas defines `beatPatternSchema` from PRD section 6 (if Kishan hasn't pushed his); #5 imports it.
- **Re-check scope at Wednesday noon:** if #5 and #6 aren't in review by then, re-split Sprint 2 so a playable editor exists before the Thursday noon feature freeze.
- **Delete each branch right after merging,** so stacked PRs retarget to `main` automatically.
- **Kishan posts standups every morning and evening,** and says "I'm stuck" or "I'm behind" in the standup instead of going quiet.
- **Carry #7 and #10 into Sprint 2,** after #12 and #16, and drop them to Backlog at the freeze if there's no time rather than rushing them.
- **CLAUDE.md additions** (for the v1.2 restructure): wrap session reads in `<Suspense>` and call `connection()` first; use `swagger-ui-dist`, not `swagger-ui-react`; E2E tests seed data with plain SQL via `pg` (Playwright can't load the Prisma client); watch for `prisma init` adding files to `.claude/`.
