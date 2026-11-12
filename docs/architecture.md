# LoopLab architecture

LoopLab is one Next.js 16 app (App Router) deployed on Vercel, backed by a Neon Postgres database. Sound is generated in the browser with Tone.js; the server only ever stores **beat patterns as JSON**, never audio.

## System diagram

Boxes marked (planned) are on the Sprint 1 or 2 board but not merged yet. A PNG copy is in [`diagrams/architecture.png`](diagrams/architecture.png).

```mermaid
flowchart LR
  subgraph Browser
    UI["Pages (React 19 + Tailwind 4)<br/>/ editor · /gallery · /signin · /register<br/>/me · /b/{id} (planned) · /api-docs"]
    Editor["Sequencer state<br/>useReducer + undo/redo (planned)"]
    Audio["Audio engine<br/>Tone.js / Web Audio (planned)"]
    UI --> Editor --> Audio
  end

  subgraph Vercel["Vercel (Next.js 16)"]
    RSC["Server Components<br/>gallery list, header session"]
    API["Route handlers /api/*<br/>register · beats · likes · openapi"]
    AuthJS["Auth.js v5<br/>Credentials + JWT cookie"]
    Lib["src/lib<br/>validation (Zod) · db (Prisma) · api errors"]
    RSC --> Lib
    API --> Lib
    API --> AuthJS
    RSC --> AuthJS
    AuthJS --> Lib
  end

  DB[("Neon Postgres<br/>User · Beat · Like")]

  UI -- "HTTPS: pages + fetch /api/*" --> RSC
  UI -- "fetch JSON" --> API
  Lib -- "Prisma 7 + pg adapter" --> DB

  subgraph Delivery["Delivery"]
    GH["GitHub PR"] --> CI["GitHub Actions<br/>lint → tests → build → E2E"]
    GH --> Preview["Vercel preview deploy<br/>+ Neon branch per preview"]
    Main["merge to main"] --> Prod["Vercel production<br/>prisma migrate deploy → next build"]
  end
```

## How a request flows

| Example | Path through the system |
|---|---|
| Open `/gallery` | Server Component reads the session (Auth.js, inside `<Suspense>`) → `listPublicBeats()` in `src/lib/db/beats.ts` → Prisma → Postgres → cards stream into the page |
| Click ♥ on a card | `LikeButton` (client) → `POST /api/beats/{id}/like` → `getCurrentUserId()` → `likeBeat()` → JSON `{ liked, likeCount }` |
| Register | `AuthForm` → `POST /api/auth/register` → Zod `registerSchema` → `createUser()` (bcrypt) → then Auth.js `signIn("credentials")` sets the JWT cookie |
| Play a beat (planned) | Grid click → `sequencerReducer` → `usePlayback` → `lib/audio/engine.ts` → Tone.js. No server involved. |

## Key rules (from `CLAUDE.md`)

- **Pages stay thin.** Logic lives in `src/lib/` (pure TypeScript, unit-tested) and route handlers follow one pattern: validate (Zod) → check auth/ownership → call `src/lib/db` → JSON, with errors as `{ error: { code, message } }`.
- **Only `src/lib/db` talks to Prisma; only `src/lib/audio` imports Tone.js.**
- **Private beats return 404** to non-owners, so they can't be discovered.
- **Cache Components is on** (Next.js 16): anything that reads the session or search params renders inside `<Suspense>` and calls `connection()` first.

## Database schema

Source of truth: [`prisma/schema.prisma`](../prisma/schema.prisma). Migrations in `prisma/migrations/`. PNG copy: [`diagrams/database.png`](diagrams/database.png).

```mermaid
erDiagram
  User ||--o{ Beat : owns
  User ||--o{ Like : gives
  Beat ||--o{ Like : receives
  Beat |o--o{ Beat : "remixed from"

  User {
    string id PK "cuid"
    string email UK "lowercase"
    string displayName
    string passwordHash "bcrypt, never returned"
    datetime createdAt
  }

  Beat {
    string id PK "cuid"
    string ownerId FK "delete user: cascade"
    string title "default: Untitled beat"
    json pattern "BeatPattern, PRD section 6"
    boolean isPublic "default: false"
    string remixedFromId FK "nullable; delete original: set null"
    datetime createdAt
    datetime updatedAt
  }

  Like {
    string userId PK, FK "delete user: cascade"
    string beatId PK, FK "delete beat: cascade"
    datetime createdAt
  }
```

**Indexes:** `User.email` (unique), `Beat(ownerId, updatedAt)` for My Beats, `Beat(isPublic, createdAt)` for the gallery, `Like(beatId)` for like counts. `Like`'s primary key `(userId, beatId)` is what enforces one like per user per beat.

**Why `pattern` is JSON instead of tables:** a beat is always loaded and saved as a whole, never queried by individual steps, so one validated JSON column is simpler and cheaper than 80 step rows per beat.
