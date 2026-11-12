import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import * as engine from "@/lib/audio/engine";
import { defaultPattern } from "@/lib/validation/beat";
import { Editor, type EditorProps } from "./Editor";

// Tests never play sound: they check what the audio engine was told.
vi.mock("@/lib/audio/engine");
const router = vi.hoisted(() => ({ push: vi.fn(), replace: vi.fn(), refresh: vi.fn() }));
vi.mock("next/navigation", () => ({ useRouter: () => router, usePathname: () => "/" }));
const fetchMock = vi.fn();

beforeEach(() => {
  vi.resetAllMocks();
  window.history.replaceState(null, "", "/");
  vi.stubGlobal("fetch", fetchMock);
});

afterEach(() => {
  vi.unstubAllGlobals();
});

/** A new, unsaved beat, signed out, unless the test says otherwise. */
const NEW_BEAT: EditorProps = { beatId: null, initialTitle: "", signedIn: false };

function renderEditor(props: Partial<EditorProps> = {}) {
  return render(<Editor {...NEW_BEAT} {...props} />);
}

/** Labels of the cells marked as the playhead column. */
function playheadCells() {
  return screen
    .getAllByRole("button")
    .filter((cell) => cell.hasAttribute("data-playhead"))
    .map((cell) => cell.getAttribute("aria-label"));
}

describe("Editor", () => {
  it("starts with every step off", () => {
    renderEditor();
    expect(screen.getAllByRole("button", { name: /step \d+$/ })).toHaveLength(80);
    expect(screen.queryAllByRole("button", { pressed: true })).toHaveLength(0);
  });

  it("toggles a step on and off when its cell is clicked", async () => {
    renderEditor();
    const cell = screen.getByRole("button", { name: "Kick step 5" });

    await userEvent.click(cell);
    expect(cell).toHaveAttribute("aria-pressed", "true");

    await userEvent.click(cell);
    expect(cell).toHaveAttribute("aria-pressed", "false");
  });

  it("toggles a focused step with the keyboard", async () => {
    renderEditor();
    const cell = screen.getByRole("button", { name: "Synth step 12" });
    cell.focus();

    await userEvent.keyboard("{Enter}");
    expect(cell).toHaveAttribute("aria-pressed", "true");

    await userEvent.keyboard(" ");
    expect(cell).toHaveAttribute("aria-pressed", "false");
  });

  it("turns every step off when Clear is clicked", async () => {
    renderEditor();
    for (const name of ["Kick step 1", "Snare step 5", "Hi-hat step 16"]) {
      await userEvent.click(screen.getByRole("button", { name }));
    }
    expect(screen.getAllByRole("button", { pressed: true })).toHaveLength(3);

    await userEvent.click(screen.getByRole("button", { name: "Clear" }));
    expect(screen.queryAllByRole("button", { pressed: true })).toHaveLength(0);
  });

});

describe("Editor playback", () => {
  it("does not start audio until Play is clicked", async () => {
    renderEditor();
    await userEvent.click(screen.getByRole("button", { name: "Kick step 1" }));
    expect(engine.start).not.toHaveBeenCalled();
    expect(engine.update).not.toHaveBeenCalled();
  });

  it("plays and stops the loop, switching the button between ▶ and ■", async () => {
    renderEditor();
    await userEvent.click(screen.getByRole("button", { name: "Kick step 1" }));
    const play = screen.getByRole("button", { name: "Play" });
    expect(play).toHaveTextContent("▶");

    await userEvent.click(play);
    const [pattern] = vi.mocked(engine.start).mock.calls[0];
    expect(pattern.tracks.kick.steps[0]).toBe(true);
    expect(pattern.bpm).toBe(82);
    const stop = screen.getByRole("button", { name: "Stop" });
    expect(stop).toHaveTextContent("■");

    await userEvent.click(stop);
    expect(engine.stop).toHaveBeenCalled();
    expect(screen.getByRole("button", { name: "Play" })).toHaveTextContent("▶");
  });

  it("toggles play and stop with Space when focus is not on a control", async () => {
    renderEditor();
    await userEvent.keyboard(" ");
    expect(screen.getByRole("button", { name: "Stop" })).toBeInTheDocument();
    expect(engine.start).toHaveBeenCalledOnce();

    await userEvent.keyboard(" ");
    expect(screen.getByRole("button", { name: "Play" })).toBeInTheDocument();
  });

  it("leaves Space to the cell, button, or slider that has focus", async () => {
    renderEditor();
    const cell = screen.getByRole("button", { name: "Bass step 2" });
    cell.focus();
    await userEvent.keyboard(" ");
    expect(cell).toHaveAttribute("aria-pressed", "true");

    screen.getByRole("slider", { name: "Tempo" }).focus();
    await userEvent.keyboard(" ");
    screen.getByRole("button", { name: "Clear" }).focus();
    await userEvent.keyboard(" ");

    expect(engine.start).not.toHaveBeenCalled();
    expect(screen.getByRole("button", { name: "Play" })).toBeInTheDocument();
  });

  it("highlights the column the engine is playing, and nothing once stopped", async () => {
    renderEditor();
    await userEvent.click(screen.getByRole("button", { name: "Play" }));
    const onStep = vi.mocked(engine.start).mock.calls[0][1];

    act(() => onStep(2));
    expect(playheadCells()).toEqual(["Kick step 3", "Snare step 3", "Hi-hat step 3", "Bass step 3", "Synth step 3"]);
    act(() => onStep(3));
    expect(playheadCells()).toHaveLength(5);
    expect(playheadCells()[0]).toBe("Kick step 4");

    await userEvent.click(screen.getByRole("button", { name: "Stop" }));
    expect(playheadCells()).toEqual([]);
  });

  it("sends a cell toggled while playing to the engine, without restarting", async () => {
    renderEditor();
    await userEvent.click(screen.getByRole("button", { name: "Play" }));
    await userEvent.click(screen.getByRole("button", { name: "Snare step 5" }));

    expect(vi.mocked(engine.update).mock.lastCall?.[0].tracks.snare.steps[4]).toBe(true);
    expect(engine.start).toHaveBeenCalledOnce();
    expect(engine.stop).not.toHaveBeenCalled();
  });
});

/** Labels of the cells that are on. */
function onCells() {
  return screen.queryAllByRole("button", { pressed: true }).map((cell) => cell.getAttribute("aria-label"));
}

const undoButton = () => screen.getByRole("button", { name: "Undo" });
const redoButton = () => screen.getByRole("button", { name: "Redo" });

/** Drags the tempo slider through `values`, then lets go (the native change event). */
function dragTempo(values: number[]) {
  const tempo = screen.getByRole("slider", { name: "Tempo" });
  for (const value of values) fireEvent.input(tempo, { target: { value: String(value) } });
  fireEvent.change(tempo);
}

describe("Editor undo and redo", () => {
  it("disables Undo and Redo until there is something to undo or redo", async () => {
    renderEditor();
    expect(undoButton()).toBeDisabled();
    expect(redoButton()).toBeDisabled();

    await userEvent.click(screen.getByRole("button", { name: "Kick step 1" }));
    expect(undoButton()).toBeEnabled();
    expect(redoButton()).toBeDisabled();

    await userEvent.click(undoButton());
    expect(onCells()).toEqual([]);
    expect(undoButton()).toBeDisabled();
    expect(redoButton()).toBeEnabled();

    await userEvent.click(redoButton());
    expect(onCells()).toEqual(["Kick step 1"]);
    expect(redoButton()).toBeDisabled();
  });

  it("clears Redo after a new change", async () => {
    renderEditor();
    await userEvent.click(screen.getByRole("button", { name: "Kick step 1" }));
    await userEvent.click(screen.getByRole("button", { name: "Kick step 2" }));
    await userEvent.click(undoButton());
    expect(redoButton()).toBeEnabled();

    await userEvent.click(screen.getByRole("button", { name: "Snare step 5" }));
    expect(redoButton()).toBeDisabled();
    expect(onCells()).toEqual(["Kick step 1", "Snare step 5"]);
  });

  it("undoes Clear and tempo changes", async () => {
    renderEditor();
    await userEvent.click(screen.getByRole("button", { name: "Kick step 1" }));
    await userEvent.click(screen.getByRole("button", { name: "Hi-hat step 9" }));
    dragTempo([100]);
    await userEvent.click(screen.getByRole("button", { name: "Clear" }));
    expect(onCells()).toEqual([]);

    await userEvent.click(undoButton());
    expect(onCells()).toEqual(["Kick step 1", "Hi-hat step 9"]);
    expect(screen.getByRole("slider", { name: "Tempo" })).toHaveValue("100");

    await userEvent.click(undoButton());
    expect(screen.getByRole("slider", { name: "Tempo" })).toHaveValue("82");
  });

  it("makes a whole tempo drag one undo step", async () => {
    renderEditor();
    dragTempo([84, 90, 97, 105, 112]);
    expect(screen.getByRole("slider", { name: "Tempo" })).toHaveValue("112");
    expect(screen.getAllByText("112 BPM")).toHaveLength(2);

    await userEvent.click(undoButton());
    expect(screen.getByRole("slider", { name: "Tempo" })).toHaveValue("82");
    expect(undoButton()).toBeDisabled();
  });

  it("undoes with Cmd+Z or Ctrl+Z, and redoes with Shift+Cmd+Z, Shift+Ctrl+Z, or Ctrl+Y", async () => {
    renderEditor();
    for (const name of ["Kick step 1", "Kick step 2", "Kick step 3"]) {
      await userEvent.click(screen.getByRole("button", { name }));
    }

    await userEvent.keyboard("{Meta>}z{/Meta}");
    expect(onCells()).toEqual(["Kick step 1", "Kick step 2"]);
    await userEvent.keyboard("{Control>}z{/Control}");
    expect(onCells()).toEqual(["Kick step 1"]);

    await userEvent.keyboard("{Meta>}{Shift>}z{/Shift}{/Meta}");
    expect(onCells()).toEqual(["Kick step 1", "Kick step 2"]);
    await userEvent.keyboard("{Control>}{Shift>}z{/Shift}{/Control}");
    expect(onCells()).toEqual(["Kick step 1", "Kick step 2", "Kick step 3"]);

    await userEvent.keyboard("{Control>}z{/Control}");
    await userEvent.keyboard("{Control>}y{/Control}");
    expect(onCells()).toEqual(["Kick step 1", "Kick step 2", "Kick step 3"]);
  });

  it("uses the shortcuts while the tempo slider has focus", async () => {
    renderEditor();
    dragTempo([120]);
    screen.getByRole("slider", { name: "Tempo" }).focus();
    await userEvent.keyboard("{Control>}z{/Control}");
    expect(screen.getByRole("slider", { name: "Tempo" })).toHaveValue("82");
  });

  it("leaves Cmd/Ctrl+Z to a text field that has focus", async () => {
    render(
      <>
        <input aria-label="Notes" />
        <Editor {...NEW_BEAT} />
      </>,
    );
    await userEvent.click(screen.getByRole("button", { name: "Kick step 1" }));
    screen.getByRole("textbox", { name: "Notes" }).focus();
    await userEvent.keyboard("{Control>}z{/Control}");
    await userEvent.keyboard("{Meta>}z{/Meta}");
    await userEvent.keyboard("{Control>}y{/Control}");
    expect(onCells()).toEqual(["Kick step 1"]);
  });

  it("does not undo playback: undo while playing changes what plays, not whether it plays", async () => {
    renderEditor();
    await userEvent.click(screen.getByRole("button", { name: "Play" }));
    await userEvent.click(screen.getByRole("button", { name: "Kick step 1" }));
    act(() => vi.mocked(engine.start).mock.calls[0][1](2));

    await userEvent.click(undoButton());
    expect(screen.getByRole("button", { name: "Stop" })).toBeInTheDocument();
    expect(playheadCells()[0]).toBe("Kick step 3");
    expect(vi.mocked(engine.update).mock.lastCall?.[0].tracks.kick.steps[0]).toBe(false);
    expect(engine.stop).not.toHaveBeenCalled();
    expect(undoButton()).toBeDisabled();
  });
});

const okJson = (body: unknown, status = 200) => Promise.resolve(new Response(JSON.stringify(body), { status }));

describe("Editor row volume and mute (US-3)", () => {
  /** The pattern the engine was last told about. */
  const heard = () => vi.mocked(engine.update).mock.calls.at(-1)?.[0];
  const mute = (name: string) => screen.getByRole("button", { name: `Mute ${name}` });
  const volume = (name: string) => screen.getByRole("slider", { name: `${name} volume` });

  function dragVolume(name: string, values: number[]) {
    for (const value of values) fireEvent.input(volume(name), { target: { value: String(value) } });
    fireEvent.change(volume(name));
  }

  it("mutes a row live while playing, and Undo unmutes it", async () => {
    renderEditor();
    await userEvent.click(screen.getByRole("button", { name: "Kick step 1" }));
    await userEvent.click(screen.getByRole("button", { name: "Play" }));

    await userEvent.click(mute("Kick"));
    expect(mute("Kick")).toHaveAttribute("aria-pressed", "true");
    expect(heard()?.tracks.kick.muted).toBe(true);
    // Muting is a sound change, not a step change, and it doesn't stop the music.
    expect(onCells()).toEqual(["Kick step 1"]);
    expect(screen.getByRole("button", { name: "Stop" })).toBeInTheDocument();

    await userEvent.click(undoButton());
    expect(mute("Kick")).toHaveAttribute("aria-pressed", "false");
    expect(heard()?.tracks.kick.muted).toBe(false);
    await userEvent.click(redoButton());
    expect(mute("Kick")).toHaveAttribute("aria-pressed", "true");
  });

  it("plays a row's new volume live, and makes a whole volume drag one undo step", async () => {
    renderEditor();
    await userEvent.click(screen.getByRole("button", { name: "Play" }));

    dragVolume("Snare", [70, 58, 40]);
    expect(volume("Snare")).toHaveValue("40");
    expect(heard()?.tracks.snare.volume).toBe(40);

    await userEvent.click(undoButton());
    expect(volume("Snare")).toHaveValue("80");
    expect(heard()?.tracks.snare.volume).toBe(80);
    expect(undoButton()).toBeDisabled();
  });

  it("starts from a saved beat's volume and mute", () => {
    const pattern = defaultPattern();
    pattern.tracks.hihat.volume = 30;
    pattern.tracks.bass.muted = true;
    renderEditor({ beatId: "b1", initialTitle: "rainy window", initialPattern: pattern, signedIn: true });
    expect(volume("Hi-hat")).toHaveValue("30");
    expect(mute("Bass")).toHaveAttribute("aria-pressed", "true");
  });

  it("saves the volume and mute with the beat", async () => {
    fetchMock.mockReturnValue(okJson({ beat: { id: "b1" } }));
    renderEditor({ beatId: "b1", initialTitle: "rainy window", signedIn: true });
    dragVolume("Bass", [35]);
    await userEvent.click(mute("Synth"));
    expect(screen.getByText("Unsaved changes")).toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: "Save" }));
    const saved = JSON.parse(fetchMock.mock.calls[0][1].body).pattern;
    expect(saved.tracks.bass).toMatchObject({ volume: 35, muted: false });
    expect(saved.tracks.synth).toMatchObject({ volume: 80, muted: true });
  });
});

describe("Editor title and saving", () => {
  it("shows the beat's name once, in the title field, with the tempo beside it", () => {
    renderEditor();
    const title = screen.getByRole("textbox", { name: "Beat title" });
    expect(title).toHaveValue("");
    expect(title).toHaveAttribute("placeholder", "Untitled beat");
    expect(screen.queryByText("Untitled beat")).toBeNull();
    expect(screen.queryByRole("heading", { name: "Untitled beat" })).toBeNull();
    // Once beside the title, once next to the tempo slider.
    expect(screen.getAllByText("82 BPM")).toHaveLength(2);
    expect(screen.getByRole("button", { name: "Save" })).toBeInTheDocument();
  });

  it("starts from the given beat, with a fresh undo history", () => {
    const pattern = defaultPattern();
    pattern.bpm = 96;
    pattern.tracks.snare.steps[4] = true;
    renderEditor({ beatId: "b1", initialTitle: "rainy window", initialPattern: pattern, signedIn: true });

    expect(screen.getByRole("textbox", { name: "Beat title" })).toHaveValue("rainy window");
    expect(onCells()).toEqual(["Snare step 5"]);
    expect(screen.getByRole("slider", { name: "Tempo" })).toHaveValue("96");
    expect(undoButton()).toBeDisabled();
    expect(redoButton()).toBeDisabled();
  });

  it("saves the current pattern without adding an undo step", async () => {
    fetchMock.mockReturnValue(okJson({ beat: { id: "b1", title: "rainy window" } }));
    renderEditor({ beatId: "b1", initialTitle: "rainy window", signedIn: true });
    await userEvent.click(screen.getByRole("button", { name: "Kick step 1" }));

    await userEvent.click(screen.getByRole("button", { name: "Save" }));
    expect(fetchMock).toHaveBeenCalledWith("/api/beats/b1", expect.objectContaining({ method: "PATCH" }));
    expect(JSON.parse(fetchMock.mock.calls[0][1].body).pattern.tracks.kick.steps[0]).toBe(true);
    expect(await screen.findByText("Saved")).toBeInTheDocument();

    await userEvent.click(undoButton());
    expect(onCells()).toEqual([]);
    expect(undoButton()).toBeDisabled();
  });

  it("keeps playing and keeps the undo history when the first save creates the beat", async () => {
    fetchMock.mockReturnValueOnce(okJson({ beat: { id: "b9" } }, 201)).mockReturnValueOnce(okJson({ beat: { id: "b9" } }));
    renderEditor({ signedIn: true });
    await userEvent.click(screen.getByRole("button", { name: "Kick step 1" }));
    await userEvent.click(screen.getByRole("button", { name: "Play" }));

    await userEvent.click(screen.getByRole("button", { name: "Save" }));
    expect(await screen.findByText("Saved")).toBeInTheDocument();
    expect(window.location.pathname).toBe("/beats/b9");
    expect(screen.getByRole("button", { name: "Stop" })).toBeInTheDocument();
    expect(engine.stop).not.toHaveBeenCalled();
    expect(engine.start).toHaveBeenCalledTimes(1);

    await userEvent.click(undoButton());
    expect(onCells()).toEqual([]);
    await userEvent.click(screen.getByRole("button", { name: "Save" }));
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(2));
    expect(fetchMock).toHaveBeenLastCalledWith("/api/beats/b9", expect.objectContaining({ method: "PATCH" }));
  });

  it("lets you type a title without playing, undoing, or toggling anything", async () => {
    renderEditor();
    await userEvent.click(screen.getByRole("button", { name: "Kick step 1" }));
    const title = screen.getByRole("textbox", { name: "Beat title" });
    await userEvent.type(title, "rainy window");
    await userEvent.keyboard("{Control>}z{/Control}");

    expect(engine.start).not.toHaveBeenCalled();
    expect(onCells()).toEqual(["Kick step 1"]);
  });
});

describe("Editor visibility and sharing (US-4, US-5)", () => {
  const SAVED_BEAT: Partial<EditorProps> = { beatId: "b1", initialTitle: "rainy window", signedIn: true };
  const shareButton = () => screen.getByRole("button", { name: "Copy share link" });

  it("has no Public/Private toggle for a beat that isn't saved yet, and can't be shared", () => {
    renderEditor();
    expect(screen.queryByRole("button", { name: "Make public" })).toBeNull();
    expect(screen.queryByText("Private")).toBeNull();
    expect(shareButton()).toBeDisabled();
  });

  it("shows a saved beat as Private, and lets you share it once it's public", async () => {
    fetchMock.mockReturnValue(okJson({ beat: { id: "b1", isPublic: true } }));
    renderEditor(SAVED_BEAT);
    expect(screen.getByText("Private")).toBeInTheDocument();
    expect(shareButton()).toBeDisabled();
    expect(shareButton()).toHaveAccessibleDescription("Make the beat public to share it.");

    await userEvent.click(screen.getByRole("button", { name: "Make public" }));

    expect(await screen.findByText("Public")).toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledWith("/api/beats/b1", expect.objectContaining({ method: "PATCH" }));
    expect(shareButton()).toBeEnabled();
    // Visibility is saved on its own: it isn't an edit to undo, and the beat isn't left unsaved.
    expect(undoButton()).toBeDisabled();
    expect(screen.queryByText("Unsaved changes")).toBeNull();
  });

  it("starts from the saved beat's visibility", () => {
    renderEditor({ ...SAVED_BEAT, initialIsPublic: true });
    expect(screen.getByText("Public")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Make private" })).toBeInTheDocument();
    expect(shareButton()).toBeEnabled();
  });

  it("shows the toggle once the first save creates the beat", async () => {
    fetchMock.mockReturnValue(okJson({ beat: { id: "b9" } }, 201));
    renderEditor({ signedIn: true });
    await userEvent.click(screen.getByRole("button", { name: "Save" }));

    expect(await screen.findByRole("button", { name: "Make public" })).toBeInTheDocument();
    expect(screen.getByText("Private")).toBeInTheDocument();
  });
});

describe("Editor tempo", () => {
  it("has a Tempo slider from 60 to 140 BPM that starts at 82", () => {
    renderEditor();
    const tempo = screen.getByRole("slider", { name: "Tempo" });
    expect(tempo).toHaveValue("82");
    expect(tempo).toHaveAttribute("min", "60");
    expect(tempo).toHaveAttribute("max", "140");
  });

  it("shows the new tempo and applies it live while playing", async () => {
    renderEditor();
    await userEvent.click(screen.getByRole("button", { name: "Play" }));
    fireEvent.change(screen.getByRole("slider", { name: "Tempo" }), { target: { value: "120" } });

    expect(screen.getAllByText("120 BPM")).toHaveLength(2);
    expect(engine.update).toHaveBeenLastCalledWith(expect.objectContaining({ bpm: 120 }));
    expect(engine.start).toHaveBeenCalledOnce();
    expect(screen.getByRole("button", { name: "Stop" })).toBeInTheDocument();
  });
});
