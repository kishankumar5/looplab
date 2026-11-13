import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { Editor } from "./Editor";

describe("Editor", () => {
  it("starts with every step off", () => {
    render(<Editor />);
    expect(screen.getAllByRole("button", { name: /step \d+$/ })).toHaveLength(80);
    expect(screen.queryAllByRole("button", { pressed: true })).toHaveLength(0);
  });

  it("toggles a step on and off when its cell is clicked", async () => {
    render(<Editor />);
    const cell = screen.getByRole("button", { name: "Kick step 5" });

    await userEvent.click(cell);
    expect(cell).toHaveAttribute("aria-pressed", "true");

    await userEvent.click(cell);
    expect(cell).toHaveAttribute("aria-pressed", "false");
  });

  it("toggles a focused step with the keyboard", async () => {
    render(<Editor />);
    const cell = screen.getByRole("button", { name: "Synth step 12" });
    cell.focus();

    await userEvent.keyboard("{Enter}");
    expect(cell).toHaveAttribute("aria-pressed", "true");

    await userEvent.keyboard(" ");
    expect(cell).toHaveAttribute("aria-pressed", "false");
  });

  it("turns every step off when Clear is clicked", async () => {
    render(<Editor />);
    for (const name of ["Kick step 1", "Snare step 5", "Hi-hat step 16"]) {
      await userEvent.click(screen.getByRole("button", { name }));
    }
    expect(screen.getAllByRole("button", { pressed: true })).toHaveLength(3);

    await userEvent.click(screen.getByRole("button", { name: "Clear" }));
    expect(screen.queryAllByRole("button", { pressed: true })).toHaveLength(0);
  });
});
