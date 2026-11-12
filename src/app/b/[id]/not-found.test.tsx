import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import BeatNotFound from "./not-found";

describe("/b/{id} not-found page (US-5)", () => {
  it("says the beat is private or doesn't exist, without saying which", () => {
    render(<BeatNotFound />);
    expect(
      screen.getByRole("heading", { level: 1, name: "This beat is private or doesn't exist" }),
    ).toBeInTheDocument();
    // Not Next's generic 404 text.
    expect(screen.queryByText(/could not be found/i)).toBeNull();
  });

  it("links back to the gallery", () => {
    render(<BeatNotFound />);
    expect(screen.getByRole("link", { name: "Browse the gallery" })).toHaveAttribute("href", "/gallery");
  });
});
