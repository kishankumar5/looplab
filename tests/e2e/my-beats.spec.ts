import { expect, test } from "@playwright/test";
import { registerAndSignIn, seedBeatsFor, uniqueSuffix } from "./helpers";

test("My Beats needs sign-in", async ({ page }) => {
  await page.goto("/me");
  await expect(page).toHaveURL(/\/signin\?callbackUrl=%2Fme/);
});

// US-4 main flow: see my beats newest first, rename one, delete one (with confirmation).
test("list, rename, and delete my beats", async ({ page }) => {
  const suffix = uniqueSuffix();
  await registerAndSignIn(page, suffix);
  await seedBeatsFor(`fan-${suffix}@example.com`, ["older beat", "newer beat"]);

  await page.goto("/me");
  const rows = page.getByRole("listitem");
  await expect(rows).toHaveCount(2);
  await expect(rows.nth(0)).toContainText("newer beat");
  await expect(rows.nth(0)).toContainText("82 BPM");
  await expect(rows.nth(0)).toContainText("Private");

  // Rename
  await rows.nth(1).getByRole("button", { name: "Rename" }).click();
  await rows.nth(1).getByLabel("New title").fill("renamed beat");
  await rows.nth(1).getByRole("button", { name: "Save title" }).click();
  await expect(page.getByText("renamed beat")).toBeVisible();

  // Delete: dismiss first (nothing happens), then accept
  const target = page.getByRole("listitem").filter({ hasText: "newer beat" });
  page.once("dialog", (d) => d.dismiss());
  await target.getByRole("button", { name: "Delete" }).click();
  await expect(target).toBeVisible();
  page.once("dialog", (d) => d.accept());
  await target.getByRole("button", { name: "Delete" }).click();
  await expect(page.getByText("newer beat")).toHaveCount(0);

  await page.reload();
  await expect(page.getByRole("listitem")).toHaveCount(1);
  await expect(page.getByRole("listitem").first()).toContainText("renamed beat");
});
