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
  };
}

const BEAT_URL = /\/beats\/[a-z0-9]+$/;

// US-4 (#8): a signed-in user saves a new beat; it gets its own URL and shows up on My Beats.
test("save a new beat, land on its page, and find it on My Beats", async ({ page }) => {
  const suffix = uniqueSuffix();
  await registerAndSignIn(page, suffix);
  await page.goto("/");
  const { cell, onCells, title, save } = editor(page);

  await cell("Kick step 1").click();
  await cell("Snare step 5").click();
  const name = `rainy window ${suffix}`;
  await title.fill(name);
  await save.click();

  // The URL becomes /beats/{id}, and that page loads the beat back from the database.
  await expect(page).toHaveURL(BEAT_URL);
  const beatPath = new URL(page.url()).pathname;
  await expect(title).toHaveValue(name);
  await expect(onCells).toHaveCount(2);
  await expect(cell("Snare step 5")).toHaveAttribute("aria-pressed", "true");

  await page.goto("/me");
  const row = page.getByRole("listitem").filter({ hasText: name });
  await expect(row).toContainText("82 BPM");
  await expect(row).toContainText("Private");
  await expect(row.getByRole("link", { name: "Open" })).toHaveAttribute("href", beatPath);
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
  await expect(title).toHaveValue("Untitled beat");
  await expect(cell("Bass step 1")).toHaveAttribute("aria-pressed", "true");
});
