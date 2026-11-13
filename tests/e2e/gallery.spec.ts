import { expect, test } from "@playwright/test";
import { registerAndSignIn, seedCreatorWithBeats, uniqueSuffix } from "./helpers";

// US-6 main flow: browse the gallery, get asked to sign in to like, then like and unlike.
test("browse public beats and like one", async ({ page }) => {
  const suffix = uniqueSuffix();
  await seedCreatorWithBeats(suffix);

  await page.goto("/gallery");
  const card = page.getByRole("article").filter({ hasText: `public ${suffix}` });
  await expect(card).toBeVisible();
  await expect(card).toContainText(`by creator ${suffix}`);
  await expect(page.getByText(`private ${suffix}`)).toHaveCount(0);

  // Signed out: liking sends you to sign in.
  await card.getByRole("button", { name: /like/i }).click();
  await expect(page).toHaveURL(/\/signin/);

  await registerAndSignIn(page, suffix);
  await page.goto("/gallery");
  const like = page.getByRole("article").filter({ hasText: `public ${suffix}` }).getByRole("button", { name: /like/i });
  await expect(like).toHaveAttribute("aria-pressed", "false");

  await like.click();
  await expect(like).toHaveAttribute("aria-pressed", "true");
  await expect(like).toContainText("1");

  await page.reload();
  const likeAfterReload = page.getByRole("article").filter({ hasText: `public ${suffix}` }).getByRole("button", { name: /like/i });
  await expect(likeAfterReload).toHaveAttribute("aria-pressed", "true");

  await likeAfterReload.click();
  await expect(likeAfterReload).toHaveAttribute("aria-pressed", "false");
  await expect(likeAfterReload).toContainText("0");
});

test("switch between newest and most liked", async ({ page }) => {
  await page.goto("/gallery");
  await page.getByRole("link", { name: "Most liked" }).click();
  await expect(page).toHaveURL(/sort=likes/);
  await expect(page.getByRole("link", { name: "Most liked" })).toHaveAttribute("aria-current", "page");
});

// US-6: each card can preview its beat in place, one at a time.
test("preview a beat from its gallery card", async ({ page }) => {
  const suffix = uniqueSuffix();
  await seedCreatorWithBeats(suffix);
  await page.goto("/gallery");
  const card = page.getByRole("article").filter({ hasText: `public ${suffix}` });

  await card.getByRole("button", { name: `Play public ${suffix}` }).click();
  await expect(card.getByRole("button", { name: `Stop public ${suffix}` })).toBeVisible();
  await card.getByRole("button", { name: `Stop public ${suffix}` }).click();
  await expect(card.getByRole("button", { name: `Play public ${suffix}` })).toBeVisible();
});
