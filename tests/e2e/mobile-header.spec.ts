import { expect, test, type Page } from "@playwright/test";
import { registerAndSignIn, uniqueSuffix } from "./helpers";

// Phone width (iPhone SE / 13 mini class). The header must fit without sideways scrolling.
test.use({ viewport: { width: 375, height: 740 } });

async function expectNoSidewaysScroll(page: Page) {
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  expect(overflow).toBeLessThanOrEqual(0);
}

test("signed out: Sign in and every nav link are on screen", async ({ page }) => {
  await page.goto("/gallery");
  await expect(page.getByRole("link", { name: "Sign in" })).toBeInViewport({ ratio: 1 });
  for (const name of ["Editor", "My Beats", "Gallery"]) {
    await expect(page.getByRole("navigation", { name: "Main" }).getByRole("link", { name })).toBeInViewport({ ratio: 1 });
  }
  await expectNoSidewaysScroll(page);
});

test("signed in: Sign out is on screen", async ({ page }) => {
  await registerAndSignIn(page, uniqueSuffix());
  await page.goto("/gallery");
  await expect(page.getByRole("button", { name: "Sign out" })).toBeInViewport({ ratio: 1 });
  await expectNoSidewaysScroll(page);
});
