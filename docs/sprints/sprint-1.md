# Sprint 1: Mon Nov 9 to Tue Nov 10, 2026

## Planning (Nov 9, both partners)

Planned together on Nov 9 over WhatsApp. Nicholas proposed the split; Kishan agreed.

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

## Standups

Format: **Done** / **Next** / **Blocked**.

### Mon Nov 9, morning
- **Nicholas:** **Done:** sprint planning with Kishan; assigned all issues, moved Sprint 1 to end Nov 10, moved #8/#9 to Sprint 2 and #10 to Sprint 1. **Next:** #1 test tooling + CI (PR #22), then #3 database. **Blocked:** need a Neon database and Vercel access set up for #3 and #2.
- **Kishan:**

### Mon Nov 9, evening
- **Nicholas:**
- **Kishan:**

### Tue Nov 10, morning
- **Nicholas:**
- **Kishan:**

### Tue Nov 10, evening
- **Nicholas:**
- **Kishan:**

## Retrospective (Tue Nov 10)

**Completed:** _issues closed / points_

**What went well**
- Nicholas:
- Kishan:

**What didn't**
- Nicholas:
- Kishan:

**Partner feedback**
- Nicholas on Kishan:
- Kishan on Nicholas:

**Changes for Sprint 2** (including any CLAUDE.md rule changes)
-
