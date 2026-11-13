import { expect, test, type Page } from "@playwright/test";
import { registerAndSignIn, uniqueSuffix } from "./helpers";

const PATTERN = ["Kick step 1", "Snare step 5", "Hi-hat step 3"];
const cellsOn = (page: Page, gridName: string) =>
  page.getByRole("group", { name: gridName }).getByRole("button", { pressed: true });

// CLAUDE.md user flow 2 (first half) and PRD US-5: share a public beat by link; private hides it.
test("share a beat by link: a signed-out friend can listen but not edit, until it's made private", async ({
  page,
  browser,
}) => {
  const suffix = uniqueSuffix();
  await page.context().grantPermissions(["clipboard-read", "clipboard-write"]);
  await registerAndSignIn(page, suffix);

  // The owner saves a beat. It's private, so it can't be shared yet.
  await page.goto("/");
  const grid = page.getByRole("group", { name: "Step grid" });
  for (const name of PATTERN) await grid.getByRole("button", { name, exact: true }).click();
  const title = `study hall ${suffix}`;
  await page.getByRole("textbox", { name: "Beat title" }).fill(title);
  await page.getByRole("button", { name: "Save" }).click();
  await expect(page).toHaveURL(/\/beats\/[a-z0-9]+$/);
  const id = new URL(page.url()).pathname.split("/").pop();
  const origin = new URL(page.url()).origin;
  const copyLink = page.getByRole("button", { name: "Copy share link" });
  await expect(copyLink).toBeDisabled();

  // Make it public and copy its link.
  await page.getByRole("button", { name: "Make public" }).click();
  await expect(page.getByText("Public", { exact: true })).toBeVisible();
  await copyLink.click();
  await expect(page.getByRole("status").filter({ hasText: "Link copied" })).toBeVisible();
  const link = await page.evaluate(() => navigator.clipboard.readText());
  expect(link).toBe(`${origin}/b/${id}`);

  // A friend opens it signed out: same beat, read-only.
  const friendContext = await browser.newContext();
  const friend = await friendContext.newPage();
  await friend.goto(link);
  await expect(friend.getByRole("heading", { level: 1, name: title })).toBeVisible();
  await expect(friend.getByText(`fan ${suffix}`.slice(0, 40), { exact: true })).toBeVisible();
  await expect(friend.getByText(/82 BPM/)).toBeVisible();
  const sharedGrid = "Step grid (read-only)";
  await expect(cellsOn(friend, sharedGrid)).toHaveCount(PATTERN.length);
  for (const name of PATTERN) {
    await expect(friend.getByRole("button", { name, exact: true })).toHaveAttribute("aria-pressed", "true");
  }

  // It plays.
  await friend.getByRole("button", { name: "Play" }).click();
  await expect(friend.getByRole("button", { name: "Stop" })).toBeVisible();
  await expect(friend.locator("[data-playhead]").first()).toBeVisible();
  await friend.getByRole("button", { name: "Stop" }).click();

  // It can't be edited.
  const empty = friend.getByRole("button", { name: "Kick step 2", exact: true });
  await expect(empty).toBeDisabled();
  await empty.click({ force: true });
  await expect(empty).toHaveAttribute("aria-pressed", "false");
  await expect(cellsOn(friend, sharedGrid)).toHaveCount(PATTERN.length);
  await expect(friend.getByRole("textbox")).toHaveCount(0);
  await expect(friend.getByRole("button", { name: /^(Save|Clear|Undo|Make public)$/ })).toHaveCount(0);
  await expect(friend.getByRole("link", { name: "Edit", exact: true })).toHaveCount(0);

  // The editor's address sends the friend to the listen-only page.
  await friend.goto(`${origin}/beats/${id}`);
  await expect(friend).toHaveURL(link);

  // The owner makes it private from My Beats...
  await page.goto("/me");
  const row = page.getByRole("listitem").filter({ hasText: title });
  await row.getByRole("button", { name: "Make private" }).click();
  await expect(row.getByText("Private", { exact: true })).toBeVisible();

  // ...so the friend gets the not-found page, the same one as for a beat that doesn't exist...
  const hidden = friend.getByRole("heading", { level: 1, name: "This beat is private or doesn't exist" });
  await friend.goto(link);
  await expect(hidden).toBeVisible();
  await expect(friend.getByRole("heading", { name: title })).toHaveCount(0);
  await expect(friend.getByRole("link", { name: "Browse the gallery" })).toHaveAttribute("href", "/gallery");
  await friend.goto(`${origin}/b/no-such-beat`);
  await expect(hidden).toBeVisible();

  // ...while the owner still sees it, with a way back to edit.
  await page.goto(link);
  await expect(page.getByRole("heading", { level: 1, name: title })).toBeVisible();
  await expect(page.getByRole("link", { name: "Edit", exact: true })).toHaveAttribute("href", `/beats/${id}`);

  await friendContext.close();
});
