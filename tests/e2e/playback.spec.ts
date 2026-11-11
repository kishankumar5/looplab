import { expect, test } from "@playwright/test";

// US-2 + US-3 tempo (#6): press Play, watch the playhead move, change the tempo live, press Stop.
test("play the loop, follow the playhead, change the tempo, and stop", async ({ page }) => {
  await page.goto("/");
  const grid = page.getByRole("group", { name: "Step grid" });
  await grid.getByRole("button", { name: "Kick step 1", exact: true }).click();
  await grid.getByRole("button", { name: "Snare step 5", exact: true }).click();

  // The playhead is one highlighted column: a cell in each of the 5 rows.
  const playhead = grid.locator("[data-playhead]");
  const playheadStep = async () => (await playhead.first().getAttribute("aria-label"))?.replace(/\D+/, "");
  await expect(playhead).toHaveCount(0);

  await page.getByRole("button", { name: "Play" }).click();
  const stop = page.getByRole("button", { name: "Stop" });
  await expect(stop).toHaveText("■");
  await expect(playhead).toHaveCount(5);
  const firstStep = await playheadStep();
  await expect.poll(playheadStep).not.toBe(firstStep);

  // Tempo: 60 to 140 BPM, default 82. Changing it keeps the loop going.
  const tempo = page.getByRole("slider", { name: "Tempo" });
  await expect(tempo).toHaveValue("82");
  await tempo.fill("120");
  await expect(tempo).toHaveValue("120");
  await expect(page.getByText("120 BPM")).toHaveCount(2);
  await expect(stop).toBeVisible();
  const stepAfterTempo = await playheadStep();
  await expect.poll(playheadStep).not.toBe(stepAfterTempo);

  await stop.click();
  await expect(page.getByRole("button", { name: "Play" })).toHaveText("▶");
  await expect(playhead).toHaveCount(0);

  // Space toggles playback when focus is not on a cell, button, or input.
  await page.evaluate(() => (document.activeElement as HTMLElement | null)?.blur());
  await page.keyboard.press("Space");
  await expect(page.getByRole("button", { name: "Stop" })).toBeVisible();
  await page.keyboard.press("Space");
  await expect(page.getByRole("button", { name: "Play" })).toBeVisible();
});
