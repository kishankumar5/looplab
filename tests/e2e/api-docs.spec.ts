import { expect, test } from "@playwright/test";

// US-7: a developer can read the API docs in the browser.
test("API docs page shows the LoopLab API and its endpoints", async ({ page }) => {
  await page.goto("/api-docs");
  await expect(page.getByRole("heading", { name: /LoopLab API/ })).toBeVisible({ timeout: 15_000 });
  await expect(page.getByText("/api/beats/{id}/like").first()).toBeVisible();
  await expect(page.getByText("/api/auth/register").first()).toBeVisible();

  // Expanding an operation must finish loading (it used to spin forever under Turbopack).
  await page.getByText("/api/beats/{id}/like").first().click();
  await expect(page.getByText("Your like is recorded.").first()).toBeVisible();
  await expect(page.getByText("Sign in to like beats").first()).toBeVisible();
});
