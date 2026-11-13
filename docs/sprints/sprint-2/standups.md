# Sprint 2 standups (Wed Nov 11 to Sun Nov 15, 2026)

The P2 deadline moved from Thu Nov 12 to Sun Nov 15, so Sprint 2 runs through Sunday.

Format: **Done** / **Next** / **Blocked**. Morning and evening, each partner.

### Wed Nov 11, morning
- **Nicholas:** **Done:** Tuesday evening: #17 architecture and database diagrams (#29) and #8 save, rename, delete, and My Beats (#30), which also defines the shared `beatPatternSchema`. Drafted the Sprint 1 retro. **Next:** #14 remix, and the phone-width header fix Kishan flagged. **Blocked:** nothing. The stack (#22 to #30) is ready for review. Open question: who builds the `/beats/{id}` page, which Save, My Beats' Open, and Remix all need.
- **Kishan:** **Done:** Reviewed and merged #22 (CI), #24 (database), #25 (login), and #26 (deploy setup), and retargeted the stacked PRs to main. Confirmed the production deploy is Ready with migrations applied. Built #5 step grid and #6 play/stop + tempo (with an editor polish pass), both test-first, and pushed `feature/5-step-grid` and `feature/6-playback`. **Next:** #12 undo/redo (in progress); review #23, #27, #28, #30; open the #5 and #6 PRs once #30 merges. **Blocked:** the #5 and #6 PRs wait on #30, since BeatPattern lives there.

### Wed Nov 11, evening
- **Nicholas:** **Done:** #31 README production URL and site title, which also confirmed Vercel posts PR previews. #14 remix API, gallery Remix button, and My Beats credit (#32, adds the `Beat.isRemix` column). Phone-width header fix (#33). **Next:** review Kishan's editor PRs as soon as they open. **Blocked:** preview links ask for a Vercel login (Deployment Protection), so only Kishan can open them.
- **Kishan:** **Done:** Reviewed and merged #22, #23, #24, #25, #26, #27, #28, #29, #30, #31 (the whole stack is in), retargeting the stacked PRs to main. Confirmed the production deploy is Ready with migrations applied and that Vercel posts preview deploys on PRs. Built #5 step grid, #6 play/stop + tempo (with an editor polish pass), #12 undo/redo, and #16 security scanning, all test-first; opened PRs for #5 (#34), #6, #12, and #16. Wired SaveBar into the editor and added the /beats/[id] page to finish #8. **Next:** #9 share link. **Blocked:** my editor PRs need review, in order: #34, then #6, then #12, then the #8 wiring.

### Thu Nov 12, morning
- **Nicholas:** **Done:** Kishan merged the whole stack overnight, and #2 closed. The professor moved the deadline to Sun Nov 15. **Next:** review Kishan's editor PRs (#5, #6, #12) as they open; offer to take #16. **Blocked:** nothing.
- **Kishan:**

### Thu Nov 12, evening
- **Nicholas:** **Done:** Re-planned for the Sun Nov 15 deadline: feature freeze moved to Sat noon, with Sat and Sun for the README, demo video, retro, and reflections. Proposed a demo video split (Kishan: editor; Nicholas: accounts, save, gallery, remix, share, API docs). Checked that #32 and #33 still merge cleanly into main after the stack landed. **Next:** review Kishan's PRs in his order (#34, #35, #36, #38, #40, #41, then #37 and #39), then fix the conflict between #32 and his My Beats changes. **Blocked:** nothing.
- **Kishan:**

### Fri Nov 13
- **Nicholas:** **Done:** Reviewed, approved, and merged #34, #35, #36, #38, #40, #41, #37, #39 (the editor is live on production). Fixed a test-only bug in #40 (the "Edit" link check also matched the header's "Editor" link). Finished #14 remix on the share page and in the editor (#32). Built #7 muffle and vinyl crackle (#51), #13 gallery preview play (#52), #10 swing (#54), and the README plus contribution log (#53), all test-first. **Next:** resolve the merge conflicts between my open PRs as they merge; demo video. **Blocked:** Vercel previews fail on every PR: 9 Dependabot PRs plus ours went past Neon's 10 preview branches. Needs the Dependabot PRs closed and their Neon branches deleted.
- **Kishan:**
