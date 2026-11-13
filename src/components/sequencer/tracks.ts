import type { TrackId } from "@/lib/validation/beat";

export interface TrackLook {
  /** Display name, e.g. "Hi-hat". */
  name: string;
  /** Colour of the dot by the row name. */
  dot: string;
  /** Fill, border, and glow of the row's active pads. */
  activePad: string;
}

/** How each grid row looks. Class names are written out in full so Tailwind can find them. */
export const TRACK_LOOKS: Record<TrackId, TrackLook> = {
  kick: {
    name: "Kick",
    dot: "bg-kick",
    activePad: "aria-pressed:border-kick aria-pressed:bg-kick aria-pressed:shadow-glow-kick",
  },
  snare: {
    name: "Snare",
    dot: "bg-snare",
    activePad: "aria-pressed:border-snare aria-pressed:bg-snare aria-pressed:shadow-glow-snare",
  },
  hihat: {
    name: "Hi-hat",
    dot: "bg-hihat",
    activePad: "aria-pressed:border-hihat aria-pressed:bg-hihat aria-pressed:shadow-glow-hihat",
  },
  bass: {
    name: "Bass",
    dot: "bg-bass",
    activePad: "aria-pressed:border-bass aria-pressed:bg-bass aria-pressed:shadow-glow-bass",
  },
  synth: {
    name: "Synth",
    dot: "bg-synth",
    activePad: "aria-pressed:border-synth aria-pressed:bg-synth aria-pressed:shadow-glow-synth",
  },
};
