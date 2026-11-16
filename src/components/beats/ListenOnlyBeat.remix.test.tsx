import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { defaultPattern } from "@/lib/validation/beat";
import { ListenOnlyBeat, type ListenOnlyBeatProps } from "./ListenOnlyBeat";

vi.mock("@/lib/audio/engine");
vi.mock("next/navigation", () => ({ useRouter: () => ({ push: vi.fn() }), usePathname: () => "/b/b1" }));

const BEAT: ListenOnlyBeatProps = {
  id: "b1",
  title: "study hall",
  creator: "nick",
  pattern: defaultPattern(),
  isOwner: false,
  isPublic: true,
};
const renderBeat = (props: Partial<ListenOnlyBeatProps> = {}) => render(<ListenOnlyBeat {...BEAT} {...props} />);

describe("ListenOnlyBeat remix (US-6)", () => {
  it("offers Remix to listeners", () => {
    renderBeat({ signedIn: true });
    expect(screen.getByRole("button", { name: "Remix" })).toBeInTheDocument();
  });

  it("doesn't offer Remix to the owner, who has Edit instead", () => {
    renderBeat({ isOwner: true, signedIn: true });
    expect(screen.queryByRole("button", { name: "Remix" })).not.toBeInTheDocument();
  });

  it("credits the original when the beat is a remix", () => {
    renderBeat({ isRemix: true, remixedFrom: { id: "o1", title: "rainy window", creator: { displayName: "maya" } } });
    expect(screen.getByRole("link", { name: "rainy window" })).toHaveAttribute("href", "/b/o1");
  });
});
