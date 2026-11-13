import { expect, test, type Page } from "@playwright/test";

function editor(page: Page) {
  const grid = page.getByRole("group", { name: "Step grid" });
  return {
    // exact: "Kick step 1" must not also match "Kick step 10".
    cell: (name: string) => grid.getByRole("button", { name, exact: true }),
    onCells: grid.getByRole("button", { pressed: true }),
    undo: page.getByRole("button", { name: "Undo" }),
    redo: page.getByRole("button", { name: "Redo" }),
    tempo: page.getByRole("slider", { name: "Tempo" }),
  };
}

// US-3 (#12): toggle steps, undo, redo, Clear, then undo brings the pattern back.
test("undo and redo edits, and undo a Clear", async ({ page }) => {
  await page.goto("/");
  const { cell, onCells, undo, redo } = editor(page);
  await expect(undo).toBeDisabled();
  await expect(redo).toBeDisabled();

  await cell("Kick step 1").click();
  await cell("Snare step 5").click();
  await cell("Hi-hat step 3").click();
  await expect(onCells).toHaveCount(3);

  await undo.click();
  await expect(cell("Hi-hat step 3")).toHaveAttribute("aria-pressed", "false");
  await expect(onCells).toHaveCount(2);
  await expect(redo).toBeEnabled();

  await redo.click();
  await expect(cell("Hi-hat step 3")).toHaveAttribute("aria-pressed", "true");
  await expect(redo).toBeDisabled();

  await page.getByRole("button", { name: "Clear" }).click();
  await expect(onCells).toHaveCount(0);

  await undo.click();
  await expect(onCells).toHaveCount(3);
  for (const name of ["Kick step 1", "Snare step 5", "Hi-hat step 3"]) {
    await expect(cell(name)).toHaveAttribute("aria-pressed", "true");
  }

  // The same with the keyboard: Cmd/Ctrl+Z, then Shift+Cmd/Ctrl+Z.
  await page.keyboard.press("ControlOrMeta+z");
  await expect(cell("Hi-hat step 3")).toHaveAttribute("aria-pressed", "false");
  await page.keyboard.press("ControlOrMeta+Shift+z");
  await expect(cell("Hi-hat step 3")).toHaveAttribute("aria-pressed", "true");
});

// US-3 (#12): dragging a slider counts as one change, not one per movement.
test("a tempo drag is one undo step", async ({ page }) => {
  await page.goto("/");
  const { undo, tempo } = editor(page);
  await expect(tempo).toHaveValue("82");

  // Grab the thumb (82 is 27.5% of the way from 60 to 140) and drag it right in many small moves.
  const box = await tempo.boundingBox();
  if (!box) throw new Error("Tempo slider is not visible");
  const y = box.y + box.height / 2;
  await page.mouse.move(box.x + box.width * 0.275, y);
  await page.mouse.down();
  await page.mouse.move(box.x + box.width * 0.8, y, { steps: 20 });
  await page.mouse.up();

  const dragged = Number(await tempo.inputValue());
  expect(dragged).toBeGreaterThan(110);
  await expect(page.getByText(`${dragged} BPM`)).toHaveCount(2);

  await undo.click();
  await expect(tempo).toHaveValue("82");
  await expect(undo).toBeDisabled();
});
