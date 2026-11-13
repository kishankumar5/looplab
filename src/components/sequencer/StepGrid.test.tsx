import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { defaultPattern } from "@/lib/validation/beat";
import { StepGrid } from "./StepGrid";

function renderGrid(pattern = defaultPattern(), playheadStep: number | null = null) {
  const onToggleStep = vi.fn();
  render(<StepGrid pattern={pattern} playheadStep={playheadStep} onToggleStep={onToggleStep} />);
  return { onToggleStep, grid: screen.getByRole("group", { name: "Step grid" }) };
}

/** Labels of the cells marked as the playhead column. */
function playheadCells() {
  return screen
    .getAllByRole("button")
    .filter((cell) => cell.hasAttribute("data-playhead"))
    .map((cell) => cell.getAttribute("aria-label"));
}

describe("StepGrid", () => {
  it("shows the Kick, Snare, Hi-hat, Bass, and Synth rows", () => {
    const { grid } = renderGrid();
    for (const name of ["Kick", "Snare", "Hi-hat", "Bass", "Synth"]) {
      expect(within(grid).getByText(name)).toBeInTheDocument();
    }
  });

  it("numbers the steps 1 to 16", () => {
    const { grid } = renderGrid();
    for (let n = 1; n <= 16; n++) {
      expect(within(grid).getByText(String(n))).toBeInTheDocument();
    }
  });

  it("has 16 step buttons per row, labelled by row and step", () => {
    const { grid } = renderGrid();
    expect(within(grid).getAllByRole("button")).toHaveLength(80);
    expect(within(grid).getAllByRole("button", { name: /^Kick step \d+$/ })).toHaveLength(16);
    expect(within(grid).getByRole("button", { name: "Kick step 1" })).toBeInTheDocument();
    expect(within(grid).getByRole("button", { name: "Hi-hat step 16" })).toBeInTheDocument();
  });

  it("marks on steps as pressed and off steps as not pressed", () => {
    const pattern = defaultPattern();
    pattern.tracks.kick.steps[4] = true;
    renderGrid(pattern);
    expect(screen.getByRole("button", { name: "Kick step 5" })).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByRole("button", { name: "Kick step 6" })).toHaveAttribute("aria-pressed", "false");
    expect(screen.getAllByRole("button", { pressed: true })).toHaveLength(1);
  });

  it("asks to toggle a step when its cell is clicked", async () => {
    const { onToggleStep } = renderGrid();
    await userEvent.click(screen.getByRole("button", { name: "Snare step 9" }));
    expect(onToggleStep).toHaveBeenCalledExactlyOnceWith("snare", 8);
  });

  it("asks to toggle a focused step with Enter and with Space", async () => {
    const { onToggleStep } = renderGrid();
    screen.getByRole("button", { name: "Bass step 3" }).focus();
    await userEvent.keyboard("{Enter}");
    await userEvent.keyboard(" ");
    expect(onToggleStep).toHaveBeenCalledTimes(2);
    expect(onToggleStep).toHaveBeenNthCalledWith(1, "bass", 2);
    expect(onToggleStep).toHaveBeenNthCalledWith(2, "bass", 2);
  });

  it("highlights the playhead's column in every row", () => {
    renderGrid(defaultPattern(), 4);
    expect(playheadCells()).toEqual(["Kick step 5", "Snare step 5", "Hi-hat step 5", "Bass step 5", "Synth step 5"]);
  });

  it("highlights no column when stopped", () => {
    renderGrid(defaultPattern(), null);
    expect(playheadCells()).toEqual([]);
  });
});

describe("StepGrid, read-only (US-5)", () => {
  function renderReadOnly(playheadStep: number | null = null) {
    const pattern = defaultPattern();
    pattern.tracks.kick.steps[0] = true;
    render(<StepGrid pattern={pattern} playheadStep={playheadStep} />);
    return screen.getByRole("group", { name: "Step grid (read-only)" });
  }

  it("says it's read-only, and announces every cell as not editable", () => {
    const grid = renderReadOnly();
    const cells = within(grid).getAllByRole("button");
    expect(cells).toHaveLength(80);
    for (const cell of cells) expect(cell).toBeDisabled();
    expect(within(grid).getByRole("button", { name: "Kick step 1" })).toHaveAttribute("aria-pressed", "true");
  });

  it("doesn't toggle a cell on click, Enter, or Space", async () => {
    const grid = renderReadOnly();
    const empty = within(grid).getByRole("button", { name: "Snare step 9" });
    const on = within(grid).getByRole("button", { name: "Kick step 1" });

    await userEvent.click(empty);
    await userEvent.click(on);
    empty.focus();
    await userEvent.keyboard("{Enter} ");

    expect(empty).toHaveAttribute("aria-pressed", "false");
    expect(on).toHaveAttribute("aria-pressed", "true");
    expect(empty).not.toHaveFocus();
  });

  it("still shows the playhead", () => {
    renderReadOnly(2);
    expect(playheadCells()).toEqual(["Kick step 3", "Snare step 3", "Hi-hat step 3", "Bass step 3", "Synth step 3"]);
  });
});
