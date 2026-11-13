import { expect, test } from "@playwright/test";
import { registerAndSignIn, uniqueSuffix } from "./helpers";

// PRD US-3 (#7): muffle and vinyl crackle, live while playing, undoable, and saved with the beat.
test("change muffle and crackle while playing, undo, then save and reload", async ({ page, browser }) => {
  const suffix = uniqueSuffix();
  await registerAndSignIn(page, suffix);
  await page.goto("/");
  const muffle = page.getByRole("slider", { name: "Muffle" });
  const crackle = page.getByRole("slider", { name: "Vinyl crackle" });

  await page.getByRole("group", { name: "Step grid" }).getByRole("button", { name: "Kick step 1", exact: true }).click();
  await page.getByRole("button", { name: "Play" }).click();
  await muffle.fill("85");
  await crackle.fill("0");
  await expect(muffle).toHaveValue("85");
  await expect(page.getByRole("button", { name: "Stop" })).toBeVisible();

  // The crackle change is one undo step.
  await page.getByRole("button", { name: "Undo" }).click();
  await expect(crackle).not.toHaveValue("0");
  await expect(muffle).toHaveValue("85");
  await crackle.fill("40");
  await page.getByRole("button", { name: "Stop" }).click();

  await page.getByRole("button", { name: "Save" }).click();
  await expect(page).toHaveURL(/\/beats\/[a-z0-9]+$/);
  await page.reload();
  await expect(muffle).toHaveValue("85");
  await expect(crackle).toHaveValue("40");

  // The share page shows the values as text.
  await page.getByRole("button", { name: "Make public" }).click();
  await expect(page.getByText("Public", { exact: true })).toBeVisible();
  const friendContext = await browser.newContext();
  const friend = await friendContext.newPage();
  await friend.goto(page.url().replace("/beats/", "/b/"));
  await expect(friend.getByText("Muffle 85")).toBeVisible();
  await expect(friend.getByText("Vinyl crackle 40")).toBeVisible();
  await friendContext.close();
});
