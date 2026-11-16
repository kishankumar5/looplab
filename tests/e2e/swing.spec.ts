import { expect, test } from "@playwright/test";
import { registerAndSignIn, uniqueSuffix } from "./helpers";

// PRD US-3 (#10): swing 0 to 60%, live while playing, undoable, and saved with the beat.
test("change swing while playing, undo, then save and reload", async ({ page }) => {
  await registerAndSignIn(page, uniqueSuffix());
  await page.goto("/");
  const swing = page.getByRole("slider", { name: "Swing" });
  await expect(swing).toHaveValue("0");

  await page.getByRole("group", { name: "Step grid" }).getByRole("button", { name: "Hi-hat step 2", exact: true }).click();
  await page.getByRole("button", { name: "Play" }).click();
  await swing.fill("50");
  await expect(page.getByText("50%", { exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "Stop" })).toBeVisible();

  await page.getByRole("button", { name: "Undo" }).click();
  await expect(swing).toHaveValue("0");
  await page.getByRole("button", { name: "Redo" }).click();
  await expect(swing).toHaveValue("50");
  await page.getByRole("button", { name: "Stop" }).click();

  await page.getByRole("button", { name: "Save" }).click();
  await expect(page).toHaveURL(/\/beats\/[a-z0-9]+$/);
  await page.reload();
  await expect(page.getByRole("slider", { name: "Swing" })).toHaveValue("50");
});
