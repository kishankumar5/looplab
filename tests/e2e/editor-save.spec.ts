import { expect, test, type Page } from "@playwright/test";
import { registerAndSignIn, uniqueSuffix } from "./helpers";

function editor(page: Page) {
  const grid = page.getByRole("group", { name: "Step grid" });
  return {
    // exact: "Kick step 1" must not also match "Kick step 10".
    cell: (name: string) => grid.getByRole("button", { name, exact: true }),
    onCells: grid.getByRole("button", { pressed: true }),
    title: page.getByRole("textbox", { name: "Beat title" }),
    save: page.getByRole("button", { name: "Save" }),
    saved: page.getByRole("status").filter({ hasText: /^Saved$/ }),
    play: page.getByRole("button", { name: "Play" }),
    stop: page.getByRole("button", { name: "Stop" }),
    undo: page.getByRole("button", { name: "Undo" }),
  };
}

const BEAT_URL = /\/beats\/[a-z0-9]+$/;

// US-4 (#8): a signed-in user saves a new beat; it gets its own URL and shows up on My Beats.
test("save a new beat: it keeps playing at its own URL, and shows up on My Beats", async ({ page }) => {
  const suffix = uniqueSuffix();
  await registerAndSignIn(page, suffix);
  await page.goto("/");
  const { cell, onCells, title, save, saved, play, stop, undo } = editor(page);

  await cell("Kick step 1").click();
  await cell("Snare step 5").click();
  const name = `rainy window ${suffix}`;
  await title.fill(name);
  await play.click();
  await save.click();

  // The address becomes /beats/{id} and the same editor carries on: still playing, same history.
  await expect(page).toHaveURL(BEAT_URL);
  await expect(saved).toBeVisible();
  const beatPath = new URL(page.url()).pathname;
  await expect(stop).toBeVisible();
  await undo.click();
  await expect(cell("Snare step 5")).toHaveAttribute("aria-pressed", "false");

  // The next save updates the same beat.
  await save.click();
  await expect(saved).toBeVisible();
  await expect(page).toHaveURL(new RegExp(`${beatPath}$`));
  await stop.click();

  // Its page loads it back from the database.
  await page.goto(beatPath);
  await expect(title).toHaveValue(name);
  await expect(onCells).toHaveCount(1);
  await expect(cell("Kick step 1")).toHaveAttribute("aria-pressed", "true");

  await page.goto("/me");
  const row = page.getByRole("listitem").filter({ hasText: name });
  await expect(row).toHaveCount(1);
  await expect(row).toContainText("82 BPM");
  await expect(row).toContainText("Private");
  await expect(row.getByRole("link", { name: "Open" })).toHaveAttribute("href", beatPath);
});

// After the first save the page is still "/" under the hood, so leaving and coming back must behave.
test("after saving, the Editor link starts a new beat and Back returns to the saved one", async ({ page }) => {
  const suffix = uniqueSuffix();
  await registerAndSignIn(page, suffix);
  await page.goto("/");
  const { cell, onCells, title, save, saved } = editor(page);
  const name = `night bus ${suffix}`;
  await cell("Bass step 1").click();
  await title.fill(name);
  await save.click();
  await expect(saved).toBeVisible();
  await expect(page).toHaveURL(BEAT_URL);
  const beatPath = new URL(page.url()).pathname;

  await page.getByRole("navigation", { name: "Main" }).getByRole("link", { name: "Editor" }).click();
  await expect(page).toHaveURL(/\/$/);
  await expect(onCells).toHaveCount(0);
  await expect(title).toHaveValue("");

  await page.goBack();
  await expect(page).toHaveURL(new RegExp(`${beatPath}$`));
  await expect(title).toHaveValue(name);
  await expect(cell("Bass step 1")).toHaveAttribute("aria-pressed", "true");
});

// CLAUDE.md user flow 1: a visitor's Save goes through sign-in, and the beat survives the trip.
test("signed out, Save keeps the beat through sign-in, then saves it", async ({ page }) => {
  const suffix = uniqueSuffix();
  await registerAndSignIn(page, suffix);
  await page.getByRole("button", { name: "Sign out" }).click();
  await expect(page.getByRole("link", { name: "Sign in" })).toBeVisible();

  await page.goto("/");
  const { cell, onCells, title, save } = editor(page);
  await cell("Hi-hat step 3").click();
  await cell("Bass step 1").click();
  await save.click();

  await expect(page).toHaveURL(/\/signin\?callbackUrl=%2F$/);
  await page.getByLabel("Email").fill(`fan-${suffix}@example.com`);
  await page.getByLabel("Password").fill("hunter222");
  await page.getByRole("button", { name: "Sign in" }).click();

  // Back in the editor with the beat intact.
  await expect(page).toHaveURL(/\/$/);
  await expect(cell("Hi-hat step 3")).toHaveAttribute("aria-pressed", "true");
  await expect(onCells).toHaveCount(2);

  await save.click();
  await expect(page).toHaveURL(BEAT_URL);
  // Saved under the default title: its page loads it back from the database.
  await page.reload();
  await expect(title).toHaveValue("Untitled beat");
  await expect(cell("Bass step 1")).toHaveAttribute("aria-pressed", "true");
});
