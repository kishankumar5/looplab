import { act, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import * as engine from "@/lib/audio/engine";
import { defaultPattern } from "@/lib/validation/beat";
import { ListenOnlyBeat, type ListenOnlyBeatProps } from "./ListenOnlyBeat";

// Tests never play sound: they check what the audio engine was told.
vi.mock("@/lib/audio/engine");
vi.mock("next/navigation", () => ({ useRouter: () => ({ push: vi.fn() }), usePathname: () => "/b/b1" }));

beforeEach(() => {
  vi.resetAllMocks();
});

function savedPattern() {
  const pattern = defaultPattern();
  pattern.bpm = 96;
  pattern.tracks.kick.steps[0] = true;
  pattern.tracks.snare.steps[4] = true;
  pattern.tracks.hihat.volume = 40;
  pattern.tracks.bass.muted = true;
  return pattern;
}

const BEAT: ListenOnlyBeatProps = {
  id: "b1",
  title: "study hall",
  creator: "nick",
  pattern: savedPattern(),
  isOwner: false,
  isPublic: true,
};

const renderBeat = (props: Partial<ListenOnlyBeatProps> = {}) => render(<ListenOnlyBeat {...BEAT} {...props} />);
const grid = () => screen.getByRole("group", { name: "Step grid (read-only)" });
const onCells = () =>
  within(grid())
    .queryAllByRole("button", { pressed: true })
    .map((cell) => cell.getAttribute("aria-label"));

describe("ListenOnlyBeat (US-5)", () => {
  it("shows the beat's title, creator, and tempo", () => {
    renderBeat();
    expect(screen.getByRole("heading", { level: 1, name: "study hall" })).toBeInTheDocument();
    expect(screen.getByText("nick")).toBeInTheDocument();
    expect(screen.getByText(/96 BPM/)).toBeInTheDocument();
  });

  it("shows the saved pattern on a read-only grid", () => {
    renderBeat();
    expect(onCells()).toEqual(["Kick step 1", "Snare step 5"]);
    for (const cell of within(grid()).getAllByRole("button")) expect(cell).toBeDisabled();
  });

  it("doesn't change the beat when a cell is clicked or pressed", async () => {
    renderBeat();
    const cell = within(grid()).getByRole("button", { name: "Kick step 2" });
    await userEvent.click(cell);
    cell.focus();
    await userEvent.keyboard("{Enter}");
    expect(onCells()).toEqual(["Kick step 1", "Snare step 5"]);
  });

  it("keeps the cells out of the tab order", async () => {
    renderBeat();
    await userEvent.tab();
    expect(screen.getByRole("button", { name: "Play" })).toHaveFocus();
    await userEvent.tab();
    expect(document.body).toHaveFocus();
  });

  it("has no editing controls", () => {
    renderBeat();
    expect(screen.queryByRole("textbox")).toBeNull();
    expect(screen.queryByRole("slider")).toBeNull();
    for (const name of ["Save", "Clear", "Undo", "Redo", "Make public", "Make private", "Copy share link"]) {
      expect(screen.queryByRole("button", { name })).toBeNull();
    }
  });

  it("plays exactly the saved beat, and stops", async () => {
    renderBeat();
    await userEvent.click(screen.getByRole("button", { name: "Play" }));
    expect(engine.start).toHaveBeenCalledOnce();
    expect(vi.mocked(engine.start).mock.calls[0][0]).toEqual(savedPattern());

    await userEvent.click(screen.getByRole("button", { name: "Stop" }));
    expect(engine.stop).toHaveBeenCalled();
    expect(screen.getByRole("button", { name: "Play" })).toBeInTheDocument();
  });

  it("highlights the column being played", async () => {
    renderBeat();
    await userEvent.click(screen.getByRole("button", { name: "Play" }));
    const [, onStep] = vi.mocked(engine.start).mock.calls[0];
    act(() => onStep(4));
    const lit = within(grid())
      .getAllByRole("button")
      .filter((cell) => cell.hasAttribute("data-playhead"))
      .map((cell) => cell.getAttribute("aria-label"));
    expect(lit).toEqual(["Kick step 5", "Snare step 5", "Hi-hat step 5", "Bass step 5", "Synth step 5"]);
  });

  it("plays and stops with Space", async () => {
    renderBeat();
    await userEvent.keyboard(" ");
    expect(engine.start).toHaveBeenCalledOnce();
    expect(screen.getByRole("button", { name: "Stop" })).toBeInTheDocument();
  });

  it("plays the saved volume and mute, and shows which rows are muted, with no controls to change them", async () => {
    renderBeat();
    expect(within(grid()).getAllByText("Muted")).toHaveLength(1);
    expect(screen.queryAllByRole("button", { name: /^Mute/ })).toHaveLength(0);

    await userEvent.click(screen.getByRole("button", { name: "Play" }));
    const [played] = vi.mocked(engine.start).mock.calls[0];
    expect(played.tracks.hihat).toMatchObject({ volume: 40, muted: false });
    expect(played.tracks.bass).toMatchObject({ volume: 80, muted: true });
  });

  it("gives the owner an Edit link back to the editor", () => {
    renderBeat({ isOwner: true });
    expect(screen.getByRole("link", { name: "Edit" })).toHaveAttribute("href", "/beats/b1");
  });

  it("has no Edit link for anyone else", () => {
    renderBeat();
    expect(screen.queryByRole("link", { name: "Edit" })).toBeNull();
  });

  it("tells the owner of a private beat that only they can see the page", () => {
    renderBeat({ isOwner: true, isPublic: false });
    expect(screen.getByText(/only you can see this page/i)).toBeInTheDocument();
  });
});
