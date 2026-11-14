# Sprint 2 retrospective (Wed Nov 11 to Sun Nov 15, 2026)

## Retrospective (Sat Nov 14)

The deadline moved from Thu Nov 12 to Sun Nov 15, so this sprint ran four days instead of two.

**Completed:** every Must and Should user story in the PRD (US-1 to US-7). Merged so far: #5 step grid, #6 playback, #8 save from the editor, #9 share page, #11 volume and mute, #12 undo/redo, #16 security scanning, plus the Sprint 1 carryover (#13 gallery, #15 API docs, #17 diagrams). In review at the time of writing: #7 muffle and crackle, #10 swing, #13 gallery preview, #14 remix, #17 README and contribution log. Not built: the stretch goals #18 (live jam) and #19 (WAV export), as planned.

**What went well**
- Nicholas: We merged as we went instead of stacking, and the whole editor went live on production in one afternoon. Every feature PR kept the test-first commit order, and CI now runs security scans on every PR. Reviews caught real problems before they shipped, like an E2E check that matched the header's "Editor" link when it meant "Edit" (#40). Having one shared `beatPatternSchema` and one audio engine meant the share page, the gallery previews, and remix all reused the editor's code instead of copying it.
- Kishan:

**What didn't**
- Nicholas: Several PRs touched the same files at once (the reducer, `BeatCard`, the editor tests), so later PRs needed merge-conflict fixes. Near the end, PR previews stopped working: Dependabot's 9 PRs plus ours went past Neon's 10 free preview databases. I deleted a merged branch from the command line, which closed the PR stacked on it (#35) until I restored it. And tests can check that muffle, crackle, and swing are wired correctly, but not whether they sound good, so those needed a listen by a person before the demo.
- Kishan:

**Partner feedback**
- Nicholas on Kishan: Kishan's PRs were a pleasure to review. Each one was test-first, came with screenshots, and handled details I wouldn't have thought of: a limiter so five rows at full volume can't clip, keeping playback and undo history running through the first save, and redirecting non-owners from the editor to the listen-only page. He also tested the whole flow on a preview with a real database before handing the stack over, so the reviews went quickly and the editor worked on production the day it merged.
- Kishan on Nicholas:
