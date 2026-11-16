import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { LofiPanel } from "./LofiPanel";

describe("LofiPanel (#7)", () => {
  it("shows Muffle and Vinyl crackle sliders with the beat's values", () => {
    render(<LofiPanel effects={{ muffle: 30, crackle: 20 }} controls={{ onChange: vi.fn(), onCommit: vi.fn() }} />);
    expect(screen.getByRole("heading", { name: "Lo-fi" })).toBeInTheDocument();
    expect(screen.getByRole("slider", { name: "Muffle" })).toHaveValue("30");
    expect(screen.getByRole("slider", { name: "Vinyl crackle" })).toHaveValue("20");
  });

  it("reports each move, and the release as one change", () => {
    const controls = { onChange: vi.fn(), onCommit: vi.fn() };
    render(<LofiPanel effects={{ muffle: 30, crackle: 20 }} controls={controls} />);
    fireEvent.change(screen.getByRole("slider", { name: "Muffle" }), { target: { value: "75" } });
    expect(controls.onChange).toHaveBeenCalledWith("muffle", 75);
    fireEvent.change(screen.getByRole("slider", { name: "Vinyl crackle" }), { target: { value: "0" } });
    expect(controls.onChange).toHaveBeenCalledWith("crackle", 0);
    expect(controls.onCommit).toHaveBeenCalled();
  });

  it("shows the values as text, with no sliders, when read-only", () => {
    render(<LofiPanel effects={{ muffle: 45, crackle: 5 }} />);
    expect(screen.queryByRole("slider")).toBeNull();
    expect(screen.getByText("Muffle 45")).toBeInTheDocument();
    expect(screen.getByText("Vinyl crackle 5")).toBeInTheDocument();
  });
});
