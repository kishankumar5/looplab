import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { RemixCredit } from "./RemixCredit";

describe("RemixCredit", () => {
  it("shows nothing for a beat that isn't a remix", () => {
    const { container } = render(<RemixCredit isRemix={false} remixedFrom={null} />);
    expect(container).toBeEmptyDOMElement();
  });

  it("credits the original and links to it", () => {
    render(
      <RemixCredit isRemix remixedFrom={{ id: "o1", title: "rainy window", creator: { displayName: "maya" } }} />,
    );
    expect(screen.getByText(/Remixed from/)).toHaveTextContent("Remixed from rainy window by maya");
    expect(screen.getByRole("link", { name: "rainy window" })).toHaveAttribute("href", "/b/o1");
  });

  it("says when the original is no longer available", () => {
    render(<RemixCredit isRemix remixedFrom={null} />);
    expect(screen.getByText("Remixed from a beat that is no longer available")).toBeInTheDocument();
  });
});
