# Sprint 2 planning (Wed Nov 11 to Thu Nov 12, 2026)

## Planning (Nov 9, both partners; revisit at the Sprint 1 retro)

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
| | **Total** | Nicholas 14, Kishan 13 (incl. half of #17) | **27** |

**Order and dependencies**
1. #8 early on Wednesday: #9 (share) and #14 (remix) build on saved beats.
2. Kishan starts with #11 and #12 (undo/redo is our main complex-state evidence, so it can't slip), then #9 after #8 merges.
3. #15 last among features, so the spec covers every endpoint.

Feature freeze Thursday at noon. Also due Thursday: 10-minute demo video, partner contribution log, individual 300-word reflections.
