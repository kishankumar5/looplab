<!--
  CLAUDE.md: shared rules file for LoopLab (CS6983 P2).
  Claude Code loads this file automatically at the start of every session in this repo.
  Both partners (Kishan, Nicholas) maintain it. Change it in a PR like any other code,
  and add a line to the "Rules changelog" at the bottom explaining why.

  Layout:
    1. Project context      (what we're building, stack, architecture, conventions, testing)
    2. PRD & design         (where requirements live, what the UI must look and behave like)
    3. Scrum & workflow     (issues, branches, commits, PRs)
    4. Do's and don'ts      (patterns, libraries, security, accessibility)
-->

# LoopLab

A browser-based lo-fi beat maker. Users toggle steps on a 5-row x 16-step grid, shape the sound
with lo-fi effects, save beats to an account, share them by link, and remix other people's beats.
The full requirements are in `docs/PRD.md`. **Read the PRD section for a user story before you
implement anything for it.**

Next.js-specific notes are imported below. This Next.js version is newer than most training data;
check `node_modules/next/dist/docs/` before using an API you are unsure about.
@AGENTS.md

---

## 1. Project context

### Tech stack

<!-- Majors only; exact versions are pinned in package.json. "planned" = installed by the issue named. -->

| Layer | Choice | Version |
|---|---|---|
| Runtime | Node.js | 24 LTS (CI uses the same) |
| Framework | Next.js App Router, Turbopack | 16.x |
| UI | React + Tailwind CSS | React 19, Tailwind 4 |
| Language | TypeScript, `strict: true` | 5.x |
| Audio | Tone.js (wraps the browser Web Audio API) | 15.x (planned, step grid issue) |
| Database | PostgreSQL on Neon, accessed through Prisma | Postgres 17, Prisma latest (planned, database issue) |
| Auth | Auth.js (`next-auth` v5), Credentials provider, **JWT session strategy** | v5 (planned, auth issue) |
| Validation | Zod (shared by API routes and forms) | 4.x |
| Unit / integration tests | Vitest + React Testing Library + jsdom | latest |
| E2E tests | Playwright | latest |
| API docs | OpenAPI 3.1 (`docs/openapi.yaml`) + Swagger UI at `/api-docs` | |
| CI/CD | GitHub Actions + Vercel (preview deploy per PR, production on `main`) | |

### Architecture

```
src/
  app/                      # Routes only. Keep pages thin; logic lives in lib/ and hooks/.
    page.tsx                # Editor for a new, unsaved beat
    beats/[id]/page.tsx     # Editor for a saved beat (owner only)
    b/[id]/page.tsx         # Shared, listen-only beat page (public)
    me/page.tsx             # My Beats
    gallery/page.tsx        # Public gallery
    signin/ register/       # Auth screens
    api-docs/page.tsx       # Swagger UI
    api/                    # Route handlers (route.ts). See "API route pattern" below.
  components/
    ui/                     # Generic pieces: Button, Slider, Toggle, Dialog, Toast
    sequencer/              # StepGrid, StepCell, TrackHeader, Transport, LofiPanel
    beats/                  # BeatCard, BeatList, RemixCredit
  hooks/                    # useSequencer (state + history), usePlayback (connects state to audio)
  lib/
    sequencer/              # PURE TypeScript. Pattern type, reducer, undo/redo history, swing math.
                            # No React, no Tone.js, no browser APIs. 100% unit-testable.
    audio/                  # The ONLY place that imports Tone.js. engine.ts exposes start/stop/update.
    db/                     # Prisma client singleton + one file per model (beats.ts, users.ts, likes.ts)
    auth/                   # Auth.js config and getCurrentUser() helper
    validation/             # Zod schemas (beatPatternSchema, createBeatSchema, ...)
    api/                    # apiError(), withAuth(), JSON response helpers
prisma/schema.prisma
tests/
  integration/              # API route handlers against a real test database
  e2e/                      # Playwright user flows
docs/
  PRD.md  mockup/index.html  openapi.yaml  architecture.md  sprints/
```

**Key patterns**
- **Editor state is one reducer.** `sequencerReducer(state, action)` in `src/lib/sequencer/reducer.ts`
  handles every edit (toggle step, set tempo, set swing, set volume, mute, set effect, clear, load).
  `withHistory()` wraps it for undo/redo (past / present / future arrays, max 50 entries).
  Components dispatch actions; they never mutate state.
- **Audio follows state, one way.** `usePlayback` watches the current pattern and calls
  `lib/audio/engine.ts`. Components never call Tone.js directly. This keeps components testable.
- **Server Components by default.** Add `"use client"` only to components that need state,
  effects, or event handlers (the sequencer, forms, like buttons).
- **API route pattern** (every `route.ts`):
  1. Parse and validate input with a Zod schema from `lib/validation`.
  2. Check auth and ownership with `lib/auth` helpers.
  3. Call a function in `lib/db` (routes never use Prisma directly).
  4. Return JSON. Errors go through `apiError(code, message, status)` and always look like
     `{ "error": { "code": "NOT_FOUND", "message": "Beat not found" } }`.
- **A beat is data, not audio.** The `pattern` column stores the JSON shape in PRD section 6.
  Always validate it with `beatPatternSchema` before saving or after loading.

### Naming conventions

| Thing | Convention | Example |
|---|---|---|
| React components | PascalCase file + export | `StepGrid.tsx`, `export function StepGrid` |
| Hooks | `use` + camelCase | `useSequencer.ts` |
| Other TS files | camelCase | `swing.ts`, `beats.ts` |
| Route folders | lowercase, kebab-case | `app/api-docs/` |
| Types / interfaces | PascalCase, no `I` prefix | `BeatPattern`, `TrackId` |
| Constants | UPPER_SNAKE_CASE | `STEPS_PER_BAR = 16` |
| Reducer actions | `{ type: "toggleStep", track, step }` (camelCase verb + noun) | `"setTempo"` |
| Track IDs | lowercase string union | `"kick" \| "snare" \| "hihat" \| "bass" \| "synth"` |
| Prisma models / columns | PascalCase singular / camelCase | `Beat.remixedFromId` |
| Unit tests | next to the source, `.test.ts(x)` | `reducer.test.ts` |
| E2E tests | `tests/e2e/*.spec.ts` | `share-link.spec.ts` |

Coding standards: TypeScript `strict`, no `any` (use `unknown` and narrow), named exports (except
Next.js pages/layouts, which must be default exports), functions under ~40 lines, early returns
over nested `if`s. Run `npm run lint` and `npm run typecheck` before every commit.

### Testing strategy (TDD is graded: failing tests must be committed before the code)

| Level | Tool | What it covers | Where |
|---|---|---|---|
| Unit | Vitest | `lib/sequencer` (reducer, history, swing), `lib/validation`, small components with RTL | next to source |
| Integration | Vitest | API route handlers called with a real `Request`, against a test Postgres (`DATABASE_URL_TEST`) | `tests/integration/` |
| E2E | Playwright | The 3 user flows in section 2 | `tests/e2e/` |

- **Red, green, refactor.** For every issue: write failing tests from the issue's acceptance
  criteria, commit them (`test(...): ... (#N)`), then implement until they pass, then clean up.
- **Mock audio, test logic.** Tests never play sound. Unit tests use `vi.mock("@/lib/audio/engine")`.
  Test what the engine was *told* (e.g. `engine.update` called with bpm 90), not what it played.
- Name tests by behavior: `it("clears the redo stack after a new edit")`.
- Coverage goal: **80%+ lines for `src/lib/`**, enforced in CI. UI components: test behavior, not
  styling.
- Commands: `npm test` (unit + integration), `npm run test:e2e`, `npm run test:coverage`.

---

## 2. PRD & design references

- **Requirements:** `docs/PRD.md`. User stories US-1 to US-7 with acceptance criteria; data model and
  endpoints in section 6. Each GitHub issue links to the user story it implements.
- **Mockup:** `docs/mockup/index.html` (open in a browser). Five screens: Editor, My Beats, Gallery,
  Shared beat, Sign in. **Match its layout, wording, and colors.** If the mockup and PRD disagree,
  the PRD wins; mention the conflict in your PR.

### Visual design (from the mockup)

Dark, warm, "late-night study room" look. Rounded corners (10px panels, 6px cells), rounded system
font, generous spacing. Define these as Tailwind theme tokens in `src/app/globals.css` (`@theme`)
and use the token names, never raw hex values in components:

| Token | Hex | Used for |
|---|---|---|
| `bg` | `#1d1a24` | Page background |
| `panel` / `panel-2` | `#29243a` / `#332c47` | Cards, transport bar / inactive cells, inputs |
| `line` | `#463d5e` | Borders |
| `text` / `muted` | `#f1e9da` / `#b3a8c4` | Body text / labels |
| `accent` | `#f2a65a` | Active steps, primary buttons, slider fills |
| `accent-2` | `#8fc1b5` | Playhead, links, focus rings, success toasts |
| `danger` | `#e07a7a` | Delete, mute-on, errors |

### Key UI components and expected behavior

| Component | Behavior |
|---|---|
| `StepGrid` | 5 rows x 16 cells. Visual gap after every 4th step. Row header = name, volume slider, mute button. |
| `StepCell` | A `<button aria-pressed>`. Click / Enter / Space toggles. Label: "Kick step 5". On = accent fill + glow. Highlighted with an accent-2 outline when it is the playhead column. |
| `Transport` | Round Play/Stop button (▶ / ■), Tempo slider (60 to 140, default 82), Swing slider (0 to 60%), Clear, Copy share link. Shows current values next to each slider. |
| `LofiPanel` | Muffle (0 to 100) and Vinyl crackle (0 to 100) sliders. Changes apply live while playing. |
| Title bar | Editable title, Private/Public pill + toggle, Undo, Redo, Save (primary). |
| `BeatCard` | Mini 16-column preview of the pattern, title, creator, like button with count, preview play, Open. |
| `RemixCredit` | "Remixed from {title} by {creator}" linking to `/b/{id}`, or "Remixed from a beat that is no longer available." |
| Toast | Bottom-center, accent-2 background, disappears after ~1.5s, `role="status"`. |

### User flows (implement and E2E-test these exactly)

1. **First beat:** visitor opens `/` → toggles cells → presses Play and hears the loop → adjusts
   tempo/effects → clicks Save → is sent to sign in (or register) → returns to the editor with the
   beat intact → beat saves → URL becomes `/beats/{id}`.
2. **Share and remix:** owner makes a beat Public → Copy share link → a friend opens `/b/{id}` without
   signing in → plays it → likes it (prompted to sign in if needed) → clicks Remix → lands in the
   editor on a new private copy at `/beats/{newId}` with a remix credit.
3. **Manage:** signed-in user opens `/me` → sees beats newest first → renames one → deletes one
   (with confirmation) → toggles one Public.

---

## 3. Scrum & workflow

- **Board:** GitHub Project "LoopLab" with columns Backlog → Sprint Todo → In Progress → In Review → Done.
  Milestones: **Sprint 1** (due 2026-11-04), **Sprint 2** (due 2026-11-12).
- **Every change starts from an issue.** If asked to do work with no issue, say so and suggest an
  issue title and acceptance criteria first.

### Working an issue (follow these steps in order)

1. Read the issue and the PRD user story it links to. List the acceptance criteria you'll cover.
2. Create a branch from up-to-date `main`.
3. Write failing tests for the acceptance criteria. Run them, confirm they fail for the right
   reason, commit.
4. Implement the smallest code that makes them pass. Commit.
5. Refactor if needed (tests stay green). Commit.
6. Run `npm run lint && npm run typecheck && npm test` before pushing.
7. Open a PR and fill in the template.

### Branch names

`<type>/<issue-number>-<short-kebab-description>`, where type is `feature`, `fix`, `chore`, `docs`, or `test`.
Examples: `feature/4-step-grid`, `chore/1-ci-pipeline`, `fix/23-swing-off-by-one`.

### Commit messages ([Conventional Commits](https://www.conventionalcommits.org))

```
<type>(<scope>): <imperative summary, lowercase, no period> (#<issue>)
```

- Types: `feat`, `fix`, `test`, `refactor`, `chore`, `docs`, `ci`, `style`.
- Scopes: `grid`, `transport`, `lofi`, `history`, `audio`, `auth`, `beats`, `gallery`, `share`, `api`, `db`, `ci`, `docs`.
- Examples: `test(grid): add failing tests for toggling steps (#4)`, `feat(grid): toggle steps on click (#4)`.
- One logical change per commit. A TDD feature has at least two commits: `test` then `feat`.

### Pull requests

- Title uses the commit format. Body: `Closes #N`, the acceptance-criteria checklist (ticked),
  how it was tested, and a screenshot or GIF for any UI change.
- **The partner reviews every PR.** Never merge your own PR. Each partner reviews at least 5 PRs.
- CI (lint, typecheck, tests, build, security scan) must be green before merge.
- **Merge with "Create a merge commit" or "Rebase and merge". Never squash**: squashing erases the
  failing-test-first commits that prove TDD.
- Keep PRs under ~400 changed lines; split bigger issues.
- Move the issue's card: In Progress when the branch is created, In Review when the PR opens
  (Done happens automatically when the PR merges).

### Referencing issues

- In commits: `(#N)` at the end of the summary. In PRs: `Closes #N`.
- In code, only for known follow-ups: `// TODO(#N): short reason`. Never leave a TODO without an issue number.

---

## 4. Do's and don'ts

### Do
- Put logic in pure functions in `src/lib/` and test them first; keep components thin.
- Validate every API input and every pattern loaded from the database with Zod.
- Use the theme tokens and existing `components/ui` pieces before creating new ones.
- Use `fetch` with small typed helpers for client calls; use Server Components for initial data.
- Keep the audio engine as a single long-lived instance; start Tone.js only after a user click
  (`Tone.start()` inside the Play handler).
- Return 404 (not 403) for a private beat requested by a non-owner, so private beats can't be discovered.
- Ask before adding a dependency, and say why in the PR.

### Don't
- Don't import `tone` anywhere except `src/lib/audio/`.
- Don't add a state library (Redux, Zustand, Jotai). `useReducer` + `withHistory` is the design.
- Don't use `axios`, `moment`, CSS-in-JS, or a component library (MUI, Chakra). Tailwind only.
- Don't call Prisma from components or route files directly; go through `src/lib/db`.
- Don't store audio files or use `localStorage` for saved beats. (Allowed: the one unsaved draft,
  so it survives the sign-in redirect.)
- Don't add AI or other paid third-party API calls.
- Don't skip, delete, or loosen a failing test to get CI green. Fix the code or ask.
- Don't edit the generated `AGENTS.md` block (Next.js rewrites it).

### Preferred libraries

`tone`, `zod`, `next-auth@5`, `@prisma/client` + `prisma`, `bcryptjs`, `vitest`,
`@testing-library/react`, `@testing-library/user-event`, `@playwright/test`, `swagger-ui-react`.

### Security requirements
- Secrets only in environment variables: `.env.local` locally (git-ignored), Vercel env settings for
  preview/production. Keep `.env.example` updated with every variable name and no real values.
- Hash passwords with bcrypt (cost 10+). Never return `passwordHash` from any query or endpoint;
  select fields explicitly.
- Check ownership on the server for every write (PATCH, DELETE, visibility), not just in the UI.
- Session JWT lives in an HTTP-only, `SameSite=Lax`, `Secure` (in production) cookie.
- No raw SQL string building. Prisma queries only.
- Escape nothing by hand: render user text (titles, names) as React text, never with
  `dangerouslySetInnerHTML`.

### Accessibility requirements (WCAG 2.1 AA)
- Every control is keyboard-reachable with a visible focus ring (accent-2 outline).
- Grid cells are `<button aria-pressed>` with labels like "Snare step 9". Never `div` + click handler.
- Sliders are labeled (`<label>` or `aria-label`) and show their value as text.
- Don't rely on color alone: active cells are filled, inactive cells are outlined.
- Space toggles play/stop when focus is not on a cell, button, or input.
- Respect `prefers-reduced-motion`: no glow or pulse animation on the playhead.
- Text contrast at least 4.5:1 against its background (the tokens above meet this).

---

## Rules changelog

<!-- Add a line for every change to this file: date, what changed, why. This is our iteration record. -->

| Date | Change | Why |
|---|---|---|
| 2026-10-28 | v1: initial rules from PRD v1.0 and mockup | Project kickoff (HW3) |
