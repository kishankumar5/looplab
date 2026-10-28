# HW3 Reflection: Context Engineering for LoopLab

**Team:** Kishan Kumar Selvakumar Anandraj and Nicholas Kaplun

## What we set up

LoopLab is a browser-based lo-fi beat maker. Before writing any feature code we wrote a PRD with seven user stories and acceptance criteria (`docs/PRD.md`), built a clickable mockup of all five screens (`docs/mockup/index.html`), turned the PRD into 19 GitHub issues across two sprint milestones, and wrote a shared rules file, `CLAUDE.md`. We both use Claude Code, so `CLAUDE.md` is the file our AI reads at the start of every session. It also imports the `AGENTS.md` that Next.js 16 generates, which warns the AI that this Next.js version is newer than its training data.

## How the rules file connects the PRD and mockup to the code

The PRD says *what* to build and the mockup shows *what it should look like*, but neither says *how* to build it in our codebase. The rules file fills that gap in three ways.

1. **It points the AI at the right document for each task.** Every issue names its user story, and the rules say to read that story before writing code. In our before/after test, the run with the improved (v1.1) rules read issue #5 and ticked off its acceptance criteria one by one; the run without rules built only what the one-sentence prompt described.
2. **It turns the mockup into reusable decisions.** The mockup is a single HTML file with hard-coded colors. The rules file names each color as a theme token (`accent`, `panel`, `line`...) and describes each component's behavior (for example, a step cell is a `<button aria-pressed>` labeled "Kick step 5"). With rules, the AI created those tokens and used only token names, so the result matched the mockup. Without rules, it used generic Tailwind grays and followed the browser's light or dark setting, so most people would have seen a white page.
3. **It encodes architecture the PRD never mentions.** The PRD asks for undo/redo in a later story. The rules say all editor changes go through one reducer, which undo/redo will wrap later. With rules, the AI built that reducer for a feature that didn't need it yet. Without rules, it kept state inside the grid component, which we would have had to rewrite in Sprint 2.

The biggest surprise was how much the docs did on their own. The run without rules still found the PRD and the mockup in the repo, used the PRD's track names, and copied the mockup's grid spacing. So a good PRD in the repo already helps. What the rules file added was *consistency*: folder layout, naming, theme tokens, the TDD order, and commit format. Those are the things a PRD doesn't specify and the things that make two people's code fit together.

## How the Scrum setup organizes AI-assisted development

Small issues with checklists work well as prompts. Each issue is a unit of work an AI session can finish, and its acceptance criteria become the first failing tests. The branch and commit rules (`feature/5-step-grid`, `test(grid): ... (#5)`) make every AI-made change traceable back to an issue, which matters when two people and two AI sessions are working in the same repo. Milestones and the board also keep the AI's scope in check: the rules tell it to stop and ask if no issue matches the request, and the run with rules left playback alone, adding a `TODO(#6)` that points at the issue it belongs to.

## What worked, what didn't, and what we changed

The rules raised our 12-point scorecard from 8 to 11.5 on the first try. Not everything worked:

- **The "red" step was hollow.** The AI committed failing tests before the code, but they failed only because the code files didn't exist yet. That technically counts as test-first but proves very little. **Change:** the red step now requires stub files whose functions throw "not implemented", so tests fail on real assertions. On the rerun, all 21 tests failed on "not implemented" before the implementation commit.
- **The AI couldn't read the issue.** It wasn't allowed to run `gh`, so it rebuilt the acceptance criteria from the PRD. **Change:** step 1 now says to read the issue with `gh issue view`, and to stop and ask if it can't, rather than guessing.
- **Two rules clashed.** "Ask before adding a dependency" conflicted with "include tests" in a repo with no test tools. **Change:** test tools are now pre-approved.
- **Smaller gaps:** a type-check error specific to Next.js 16 and a missing coverage script. Both are now written into the rules.

The rerun with v1.1 scored 12 of 12 and reached 100% test coverage on `src/lib`. One gap remains open: the AI still doesn't screenshot its UI work, because launching a browser needs permission. It now says so instead of staying silent, which is what the rule asks for.

The rules also cost something. The run with v1.1 rules took about three times as long as the run without, mostly on running tests before and after, lint, type checks, and separate commits. For a course that grades visible TDD history, that's a trade we accept. We also note that each condition ran only once, so some differences may be ordinary variation between runs.

## What we'd add or change for Sprint 2

- **Reference files instead of descriptions.** Once our first API route exists, the rules should say "copy the pattern in `src/app/api/beats/route.ts`." Pointing at real code is shorter and harder to misread than describing it.
- **Folder-level rules.** `CLAUDE.md` is already long. Audio-engine rules (Tone.js scheduling, how to mock it in tests) belong in a small rules file inside `src/lib/audio/`, which loads only when the AI works there.
- **Automated screenshots.** After issue #1 adds Playwright, the UI rule can say "run `npm run test:e2e -- --update-snapshots`" instead of asking for a manual screenshot.
- **Shared permissions.** Decide together whether to commit a project settings file that lets the AI read GitHub issues without asking each time.
- **PR size.** The v1.1 run produced a 640-line change, over our 400-line guideline, because test tooling arrived with the feature. Now that the tooling exists, feature PRs should stay smaller; we'll check that in the Sprint 1 retro.
- **Keep the changelog going.** Every rule change gets a dated line explaining what went wrong. That log is how we'll know which rules are working.
