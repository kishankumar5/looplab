# LoopLab: Product Requirements Document

**Team:** Kishan Kumar Selvakumar Anandraj, Nicholas Kaplun
**Course:** CS6983 AI Coding, Fall 2026, Project 2
**Status:** v1.0 (Sprint 1 planning), last updated 2026-10-28
**Mockup:** [`docs/mockup/index.html`](mockup/index.html) (open in a browser; click through every screen)

---

## 1. Problem

Making music feels out of reach for people who aren't musicians. Professional music software is expensive, slow to install, and overwhelming for a beginner who just wants a simple beat. Many students listen to lo-fi beats while studying and would enjoy making their own, but there is no simple place to start. Sharing a beat usually means exporting an audio file and sending it around.

**LoopLab** is a browser-based beat maker where anyone can build a lo-fi loop in minutes, save it, share it with a link, and remix what others have made.

## 2. Target users

| Persona | Who they are | What they want |
|---|---|---|
| **Creator** | A student or casual creator with no music training | Build a beat quickly, keep a collection, share it |
| **Listener** | Anyone who opens a share link or browses the gallery; may not have an account | Hear a beat instantly, like it, maybe remix it |
| **Developer** | Someone integrating with or testing LoopLab | A documented API for beats |

## 3. Goals and non-goals

**Goals**
- A first-time user can make and hear a beat in under 2 minutes, without signing in.
- A shared link plays the beat exactly as it was saved.
- Every beat is plain data (a pattern), not an audio file, so saving, sharing, and remixing are cheap.

**Non-goals (v1)**
- Piano-roll melody editing. Each row plays one fixed sound.
- Audio file export, custom sample upload (stretch goals, see section 7).
- Mobile apps. LoopLab is a responsive web app.
- AI features. The app makes no calls to paid AI APIs.

## 4. User stories and acceptance criteria

Priorities use MoSCoW: **Must** (required for v1), **Should** (planned), **Could** (if time allows).

### US-1 Register and sign in (Must)
*As a user, I want to register and sign in, so only I can edit my saved beats while others can only listen to the ones I make public.*
- [ ] A visitor can register with email, display name, and password (8+ characters).
- [ ] Registering with an email that already exists shows "An account with this email already exists."
- [ ] A registered user can sign in and sign out; the header shows their display name while signed in.
- [ ] Passwords are stored hashed (bcrypt), never in plain text.
- [ ] Sessions use a signed JWT in an HTTP-only cookie.
- [ ] Anyone can use the editor without signing in; clicking **Save** while signed out opens the sign-in screen and keeps the unsaved beat.

### US-2 Build a beat on the step grid (Must)
*As a beginner creator, I want to toggle steps on a grid for drums, bass and synth, and press play to hear the loop, so I can build a beat without any music training.*
- [ ] The grid has 5 rows (Kick, Snare, Hi-hat, Bass, Synth) and 16 steps.
- [ ] Clicking a cell toggles it on and off; on cells are visually filled and announced as "pressed" to screen readers.
- [ ] Steps are grouped in 4 blocks of 4 so beats are easy to count.
- [ ] **Play** starts the loop; **Stop** stops it. Space bar toggles play/stop when focus is not on a cell, button, or input.
- [ ] A playhead highlights the current step column while playing.
- [ ] Toggling a cell while playing changes the sound on the next pass of the loop, without restarting.
- [ ] **Clear** turns off every cell (undoable, see US-3).
- [ ] Sound starts only after the user's first click (browsers block audio before that).

### US-3 Shape the sound (Must: tempo, muffle, crackle, undo/redo. Should: swing, per-row volume)
*As someone shaping a sound, I want to adjust tempo, swing, volume per instrument, and lo-fi effects like a muffle filter and vinyl crackle, and undo or redo my changes, so I can experiment freely until the beat feels right.*
- [ ] Tempo: 60 to 140 BPM, default 82.
- [ ] Swing: 0% to 60%, default 0%. At 50%, every second 16th note is delayed by half of a 16th note.
- [ ] Per-row volume: 0 to 100, default 80, plus a mute button per row.
- [ ] Muffle (low-pass filter): 0 to 100, where 0 is no filtering and 100 is very muffled.
- [ ] Vinyl crackle: 0 to 100, where 0 is silent.
- [ ] All changes apply live while playing.
- [ ] Undo (Cmd/Ctrl+Z) and Redo (Cmd/Ctrl+Shift+Z) cover grid, tempo, swing, volume, and effect changes. Dragging a knob counts as one change, not one per pixel.
- [ ] History holds at least 50 steps; making a new change after undoing clears the redo history.

### US-4 Manage my beats (Must)
*As a returning creator, I want to save, rename, edit, and delete my beats, and mark each one as public or private, so my collection stays organized and I control what others see.*
- [ ] **Save** stores the current pattern and settings under a title (default "Untitled beat").
- [ ] **My Beats** lists my beats, newest first, with title, tempo, public/private badge, and last-edited date.
- [ ] I can open, rename, and delete a beat from My Beats. Delete asks for confirmation.
- [ ] New beats are **private** by default; a toggle makes a beat public.
- [ ] Only the owner can edit, rename, delete, or change visibility (enforced by the API, not just the UI).
- [ ] Leaving the editor with unsaved changes shows a warning.

### US-5 Share a beat by link (Must)
*As someone who wants to share, I want a link that opens my beat exactly as I made it, so friends can listen without exporting or downloading files.*
- [ ] Every public beat has a link: `/b/{beatId}`.
- [ ] The link opens a listen-only page: title, creator name, play/stop, the grid (read-only), and tempo/effect values.
- [ ] Playback matches the saved beat exactly (pattern, tempo, swing, volumes, effects).
- [ ] Opening the link does not require an account.
- [ ] A **private** beat's link shows "This beat is private" to everyone except the owner. (Decision: there are no secret "unlisted" links in v1; to share, make it public.)
- [ ] **Copy link** copies the URL and confirms with "Link copied."

### US-6 Browse, like, and remix (Should)
*As a listener, I want to browse public beats, like them, and remix one into my own copy with credit to the original creator, so I can discover new ideas and build on what others made.*
- [ ] **Gallery** lists public beats, sortable by Newest and Most liked, 20 per page.
- [ ] Each card shows title, creator, like count, and a play button that previews the beat in place.
- [ ] Signed-in users can like or unlike a beat; one like per user per beat.
- [ ] **Remix** (signed-in only) creates a new private beat owned by me, copied from the original, titled "{original title} (remix)".
- [ ] A remix shows "Remixed from {title} by {creator}" with a link to the original (unless the original was deleted or made private, in which case it shows "Remixed from a beat that is no longer available").

### US-7 Public API (Must)
*As a developer, I want documented API endpoints, so I can understand and test how beats are saved, shared, and remixed.*
- [ ] Every endpoint in section 6 is described in an OpenAPI 3.1 file (`docs/openapi.yaml`).
- [ ] An interactive docs page is served at `/api-docs`.
- [ ] Errors use one JSON format: `{ "error": { "code": "NOT_FOUND", "message": "..." } }`.
- [ ] Request bodies are validated; invalid input returns 400 with the field that failed.

### Stretch (Could)
- **US-8 Live jam rooms:** two signed-in users edit the same beat and see each other's changes within 1 second.
- **US-9 Export audio:** download the loop as a WAV file.
- **US-10 Custom sounds:** upload a short sample to replace a row's sound.

## 5. Screens (see mockup)

| Screen | Route | Who | Key elements |
|---|---|---|---|
| Editor | `/` (new beat), `/beats/{id}` (saved beat) | Everyone; saving needs an account | Transport bar (play, tempo, swing), 5x16 grid, row volume/mute, Lo-fi knobs (muffle, crackle), title, save, visibility toggle, undo/redo, share |
| My Beats | `/me` | Signed in | List of my beats with open, rename, delete, visibility |
| Gallery | `/gallery` | Everyone | Public beat cards, sort, like, preview, remix |
| Shared beat | `/b/{id}` | Everyone | Listen-only player, creator credit, like, remix |
| Sign in / Register | `/signin`, `/register` | Visitors | Email + password forms |
| API docs | `/api-docs` | Developers | Swagger UI |

## 6. Data model and API

### Beat pattern (stored as JSON in the `pattern` column)

```json
{
  "version": 1,
  "bpm": 82,
  "swing": 0,
  "tracks": {
    "kick":  { "steps": [true, false, ...16 values], "volume": 80, "muted": false },
    "snare": { "steps": [...], "volume": 80, "muted": false },
    "hihat": { "steps": [...], "volume": 80, "muted": false },
    "bass":  { "steps": [...], "volume": 80, "muted": false },
    "synth": { "steps": [...], "volume": 80, "muted": false }
  },
  "effects": { "muffle": 30, "crackle": 20 }
}
```

### Tables

| Table | Columns |
|---|---|
| `User` | id, email (unique), displayName, passwordHash, createdAt |
| `Beat` | id, ownerId → User, title, pattern (JSON), isPublic, remixedFromId → Beat (nullable), createdAt, updatedAt |
| `Like` | userId → User, beatId → Beat, createdAt; unique (userId, beatId) |

### Endpoints

| Method | Path | Auth | Purpose |
|---|---|---|---|
| POST | `/api/auth/register` | No | Create account |
| POST | `/api/auth/...` | No | Sign in / sign out (Auth.js) |
| GET | `/api/beats?sort=new\|likes&page=1` | No | List public beats |
| GET | `/api/me/beats` | Yes | List my beats |
| POST | `/api/beats` | Yes | Create a beat |
| GET | `/api/beats/{id}` | No* | Get a beat (*private: owner only, else 404) |
| PATCH | `/api/beats/{id}` | Owner | Update title, pattern, or visibility |
| DELETE | `/api/beats/{id}` | Owner | Delete a beat |
| POST | `/api/beats/{id}/like` | Yes | Like |
| DELETE | `/api/beats/{id}/like` | Yes | Unlike |
| POST | `/api/beats/{id}/remix` | Yes | Copy a public beat into my beats |

## 7. Requirement coverage (P2 rubric)

| P2 requirement | Where LoopLab covers it |
|---|---|
| Frontend + backend + database | Next.js app, API routes, PostgreSQL |
| Authentication (JWT) | US-1, Auth.js with JWT sessions |
| 3+ distinct features / roles | Beat editor, share links, gallery + likes + remix; roles: creator, listener, developer |
| Real-time OR complex state | Editor state: live playback + undo/redo history (US-2, US-3). Stretch: live jam (US-8) |
| Public API with docs | US-7 |

## 8. Sprint plan

| Sprint | Dates | Scope |
|---|---|---|
| Sprint 1 | Oct 29 to Nov 4 | Tooling + CI + deploy, database, US-1, US-2, tempo + muffle + crackle, US-4, US-5 |
| Sprint 2 | Nov 5 to Nov 12 | Swing, volume, undo/redo, US-6, US-7, security scanning, docs, demo video. US-8 if time allows |

Detailed issues live on the GitHub Project board.

## 9. Success measures
- New visitor hears their first beat in under 2 minutes (checked in the E2E test path and in hallway testing).
- A saved, shared beat sounds identical when opened from its link (E2E: pattern loaded from the link equals the saved pattern).
- Core logic in `src/lib/` has at least 80% test coverage.
