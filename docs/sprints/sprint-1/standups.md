# Sprint 1 standups (Mon Nov 9 to Tue Nov 10, 2026)

Format: **Done** / **Next** / **Blocked**. Morning and evening, each partner.

### Mon Nov 9, morning
- **Nicholas:** **Done:** sprint planning with Kishan; assigned all issues, moved Sprint 1 to end Nov 10, moved #8/#9 to Sprint 2 and #10 to Sprint 1. **Next:** #1 test tooling + CI (PR #22), then #3 database. **Blocked:** need a Neon database and Vercel access set up for #3 and #2.
- **Kishan:** _(posted late)_ **Done:** sprint planning with Nicholas: agreed on two 2-day sprints, the issue split, sharing one BeatPattern schema, and a Thursday-noon feature freeze. **Next:** connect Vercel + Neon; start #5 once #22's test setup merges. **Blocked:** #5 waits on #22.

### Mon Nov 9, evening
- **Nicholas:** **Done:** #1 test tooling + 4-stage CI (PR #22), #3 Postgres + Prisma schema (PR #24), #4 register/sign in/sign out with an E2E test (PR #25); all green in CI, all test-first. Sprint docs (PR #23). **Next:** #2 deploy code (migrations on deploy, `.env.example`, README). **Blocked:** #2 needs Vercel + Neon connected on Kishan's account; my PRs need review before they can merge.
- **Kishan:** _No standup posted._

### Tue Nov 10, morning
- **Nicholas:** **Done:** confirmed CI green on #22, #24, #25. **Next:** #2 code side; then Sprint 2 work that doesn't need the beat format (#13 like/list API). **Blocked:** no reviews yet on #22 to #25 (#22 also unblocks Kishan's #5); #8 waits on the `BeatPattern` schema from #5; Vercel still not connected.
- **Kishan:** _No standup posted._

### Tue Nov 10, evening
- **Nicholas:** **Done:** #2 code half (PR #26: `.env.example` with a test, migrations on every Vercel deploy, deployment docs); pulled Sprint 2 work forward since I was blocked: #13 gallery + likes (PR #27), #15 OpenAPI spec + `/api-docs` (PR #28), #17 architecture and database diagrams (PR #29). All test-first, all green in CI. **Next:** #8 save / My Beats, using the beat format from PRD section 6. **Blocked:** still no reviews on PRs #22 to #29, so nothing has merged; Vercel not connected, so #2 can't close.
- **Kishan:** _(posted late)_ **Done:** connected Vercel + Neon with a separate database branch for Preview deployments and set AUTH_SECRET; production is live at looplab-sand.vercel.app. **Next:** review #22 to #26 so the stack can merge, then build #5. **Blocked:** #5 waits on #22.
