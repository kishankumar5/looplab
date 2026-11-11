import { expect, test } from "@playwright/test";

// US-2 main flow (#5): open the editor, toggle a step on and off, then clear the grid.
test("toggle steps on the grid and clear them", async ({ page }) => {
  await page.goto("/");
  const grid = page.getByRole("group", { name: "Step grid" });
  await expect(grid.getByRole("button", { name: /step \d+$/ })).toHaveCount(80);

  // Steps come in blocks of 4: the gap after step 4 is wider than the gaps inside a block.
  const leftEdge = async (n: number) =>
    (await grid.getByRole("button", { name: `Kick step ${n}` }).boundingBox())?.x ?? 0;
  const [x3, x4, x5] = [await leftEdge(3), await leftEdge(4), await leftEdge(5)];
  expect(x5 - x4).toBeGreaterThan(x4 - x3);

  // Click toggles on (filled with the accent color) and off.
  const kick5 = grid.getByRole("button", { name: "Kick step 5" });
  await expect(kick5).toHaveAttribute("aria-pressed", "false");
  await kick5.click();
  await expect(kick5).toHaveAttribute("aria-pressed", "true");
  await expect(kick5).toHaveCSS("background-color", "rgb(242, 166, 90)");
  await kick5.click();
  await expect(kick5).toHaveAttribute("aria-pressed", "false");

  // Turn a few steps on (one with the keyboard), then Clear turns them all off.
  await grid.getByRole("button", { name: "Kick step 1" }).click();
  await grid.getByRole("button", { name: "Hi-hat step 9" }).click();
  await grid.getByRole("button", { name: "Snare step 5" }).press("Enter");
  await expect(grid.getByRole("button", { pressed: true })).toHaveCount(3);

  await page.getByRole("button", { name: "Clear" }).click();
  await expect(grid.getByRole("button", { pressed: true })).toHaveCount(0);
});
