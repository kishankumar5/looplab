import { expect, test, type Page } from "@playwright/test";
import { registerAndSignIn, uniqueSuffix } from "./helpers";

function rows(page: Page) {
  return {
    cell: (name: string) => page.getByRole("group", { name: "Step grid" }).getByRole("button", { name, exact: true }),
    mute: (name: string) => page.getByRole("button", { name: `Mute ${name}` }),
    volume: (name: string) => page.getByRole("slider", { name: `${name} volume` }),
  };
}

// PRD US-3 (#11): per-row volume and mute, live while playing, and undoable.
test("mute a row and change a volume while playing, then undo both", async ({ page }) => {
  await page.goto("/");
  const { cell, mute, volume } = rows(page);
  await cell("Kick step 1").click();
  await cell("Snare step 5").click();
  await page.getByRole("button", { name: "Play" }).click();

  await mute("Kick").click();
  await expect(mute("Kick")).toHaveAttribute("aria-pressed", "true");
  await expect(volume("Snare")).toHaveValue("80");
  await volume("Snare").fill("35");
  await expect(volume("Snare")).toHaveValue("35");
  await expect(page.getByText("35", { exact: true })).toBeVisible();

  // Still playing, and the steps are untouched.
  await expect(page.getByRole("button", { name: "Stop" })).toBeVisible();
  await expect(cell("Kick step 1")).toHaveAttribute("aria-pressed", "true");

  // The slider change is one undo step, then the mute.
  const undo = page.getByRole("button", { name: "Undo" });
  await undo.click();
  await expect(volume("Snare")).toHaveValue("80");
  await expect(mute("Kick")).toHaveAttribute("aria-pressed", "true");
  await undo.click();
  await expect(mute("Kick")).toHaveAttribute("aria-pressed", "false");
  await expect(cell("Snare step 5")).toHaveAttribute("aria-pressed", "true");
  await page.getByRole("button", { name: "Stop" }).click();
});

// Saved beats keep their volume and mute, and the listen-only page has them too.
test("a saved beat keeps its volume and mute, and its share page shows the muted row", async ({ page, browser }) => {
  const suffix = uniqueSuffix();
  await registerAndSignIn(page, suffix);
  await page.goto("/");
  const { cell, mute, volume } = rows(page);
  await cell("Bass step 1").click();
  await mute("Bass").click();
  await volume("Hi-hat").fill("20");
  await page.getByRole("button", { name: "Save" }).click();
  await expect(page).toHaveURL(/\/beats\/[a-z0-9]+$/);
  const beatUrl = page.url();

  await page.reload();
  await expect(mute("Bass")).toHaveAttribute("aria-pressed", "true");
  await expect(volume("Hi-hat")).toHaveValue("20");
  await expect(volume("Kick")).toHaveValue("80");

  await page.getByRole("button", { name: "Make public" }).click();
  await expect(page.getByText("Public", { exact: true })).toBeVisible();
  const friendContext = await browser.newContext();
  const friend = await friendContext.newPage();
  await friend.goto(beatUrl.replace("/beats/", "/b/"));
  const shared = friend.getByRole("group", { name: "Step grid (read-only)" });
  await expect(shared.getByText("Muted")).toHaveCount(1);
  await expect(friend.getByRole("slider")).toHaveCount(0);
  await friend.getByRole("button", { name: "Play" }).click();
  await expect(friend.getByRole("button", { name: "Stop" })).toBeVisible();
  await friendContext.close();
});
