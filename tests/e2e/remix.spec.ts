import { expect, test } from "@playwright/test";
import { registerAndSignIn, seedCreatorWithBeats, uniqueSuffix } from "./helpers";

test("Remix while signed out goes to sign-in", async ({ page }) => {
  const suffix = uniqueSuffix();
  await seedCreatorWithBeats(suffix);
  await page.goto("/gallery");
  await page.getByRole("article").filter({ hasText: `public ${suffix}` }).getByRole("button", { name: "Remix" }).click();
  await expect(page).toHaveURL(/\/signin\?callbackUrl=%2Fgallery/);
});

// US-6 remix flow: remix someone's public beat from the gallery; it becomes my private copy with credit.
test("remix a public beat from the gallery", async ({ page }) => {
  const suffix = uniqueSuffix();
  await seedCreatorWithBeats(suffix);
  await registerAndSignIn(page, suffix);

  await page.goto("/gallery");
  await page.getByRole("article").filter({ hasText: `public ${suffix}` }).getByRole("button", { name: "Remix" }).click();
  await expect(page).toHaveURL(/\/beats\/[^/]+$/);

  await page.goto("/me");
  const row = page.getByRole("listitem").filter({ hasText: `public ${suffix} (remix)` });
  await expect(row).toContainText("Private");
  await expect(row).toContainText(`Remixed from public ${suffix} by creator ${suffix}`);
  await expect(row.getByRole("link", { name: `public ${suffix}`, exact: true })).toHaveAttribute("href", /^\/b\//);
});

// US-5 + US-6: open a share link, remix it, and land in the editor with credit to the original.
test("remix from a share link and see the credit in the editor", async ({ page }) => {
  const suffix = uniqueSuffix();
  const { publicId } = await seedCreatorWithBeats(suffix);
  await registerAndSignIn(page, suffix);

  await page.goto(`/b/${publicId}`);
  await page.getByRole("button", { name: "Remix" }).click();
  await expect(page).toHaveURL(/\/beats\/[^/]+$/);
  await expect(page.getByText(`Remixed from public ${suffix} by creator ${suffix}`)).toBeVisible();
  await expect(page.getByRole("link", { name: `public ${suffix}`, exact: true })).toHaveAttribute("href", `/b/${publicId}`);
});
