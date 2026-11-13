# Sprint 2 planning (Wed Nov 11 to Thu Nov 12, 2026)

Planning (Nov 9, both partners; revisit at the Sprint 1 retro)

**Sprint goal:** saved beats you can share, browse, like, and remix; documented API; security scanning; final docs and demo video.

| Issue | Title | Owner | Points |
|---|---|---|---|
| #8 | Save, rename, and delete beats on a My Beats page | Nicholas | 5 |
| #13 | Browse public beats in a gallery and like them | Nicholas | 5 |
| #15 | Write the OpenAPI spec and serve Swagger docs at /api-docs | Nicholas | 3 |
| #9 | Make beats public or private and share a listen-only link | Kishan | 3 |
| #11 | Add per-row volume and mute | Kishan | 2 |
| #12 | Undo and redo editor changes | Kishan | 3 |
| #14 | Remix a public beat with credit to the original creator | Kishan | 3 |
| #16 | Add security scanning to the CI pipeline | Kishan | 1 |
| #17 | README, setup guide, architecture and database diagrams | Both | 2 |
| **Total** | | Nicholas 14, Kishan 13 (incl. half of #17) | **27** |

## Order and dependencies

- #8 early on Wednesday: #9 (share) and #14 (remix) build on saved beats.
- Kishan starts with #11 and #12 (undo/redo is our main complex-state evidence, so it can't slip), then #9 after #8 merges.
- #15 last among features, so the spec covers every endpoint.
- Feature freeze Thursday at noon. Also due Thursday: 10-minute demo video, partner contribution log, individual 300-word reflections.

## Changes after the Sprint 1 retro (Wed Nov 11)

### Carryover from Sprint 1

| Issue | Title | Owner | Points | Status |
|---|---|---|---|---|
| #5 | Toggle steps on a 5x16 step grid | Kishan | 3 | Built test-first; PR #34 open |
| #6 | Play and stop the loop with a moving playhead and tempo control | Kishan | 5 | Built test-first (with an editor polish pass); PR open, stacked on #34 |
| #7 | Add muffle (low-pass filter) and vinyl crackle effects | Nicholas if time, else Backlog | 3 | Not started |
| #10 | Add a swing control | Nicholas if time, else Backlog | 2 | Not started |

### Reassignments

- **#14 remix** moves to Nicholas, along with the mobile header fix and the gallery preview button (wired to the #6 audio engine).
- **#8:** Nicholas built the API, My Beats page, and SaveBar (#30); Kishan wires SaveBar into the editor and adds the /beats/[id] page to close it.

### Updated order for Kishan

1. #12 undo/redo: built test-first, PR open
2. #16 security scanning in CI: built, PR open
3. Finish #8 in the editor (SaveBar + /beats/[id]): built, PR open
4. #9 share link, then #11 volume and mute

#7 and #10 go to Nicholas if he has time; otherwise they move to Backlog and the Sprint 2 retro explains why.
