import { useId } from "react";
import { RangeInput } from "@/components/ui/RangeInput";
import type { EffectId } from "@/lib/sequencer/reducer";
import type { BeatPattern } from "@/lib/validation/beat";

export interface LofiControls {
  onChange: (effect: EffectId, value: number) => void;
  /** A slider was let go: one history entry. */
  onCommit: () => void;
}

export interface LofiPanelProps {
  effects: BeatPattern["effects"];
  /** Leave it out on a read-only page: the values as text. */
  controls?: LofiControls;
}

const EFFECTS: Array<{ id: EffectId; label: string }> = [
  { id: "muffle", label: "Muffle" },
  { id: "crackle", label: "Vinyl crackle" },
];

const FOCUS_RING = "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-2";

/** The Lo-fi panel below the grid (mockup Editor screen, PRD US-3): Muffle and Vinyl crackle. */
export function LofiPanel({ effects, controls }: LofiPanelProps) {
  return (
    <section
      aria-labelledby="lofi-heading"
      className="mt-3 flex flex-wrap items-center gap-5 rounded-[10px] bg-panel px-3.5 py-3"
    >
      <h2 id="lofi-heading" className="text-sm font-semibold text-muted">
        Lo-fi
      </h2>
      {EFFECTS.map(({ id, label }) =>
        controls ? (
          <EffectSlider key={id} label={label} value={effects[id]} effect={id} controls={controls} />
        ) : (
          <span key={id} className="text-sm text-muted">
            {label} {effects[id]}
          </span>
        ),
      )}
    </section>
  );
}

function EffectSlider(props: { label: string; value: number; effect: EffectId; controls: LofiControls }) {
  const { label, value, effect, controls } = props;
  const id = useId();
  return (
    <div className="flex items-center gap-2 text-sm">
      <label htmlFor={id}>{label}</label>
      <RangeInput
        id={id}
        min={0}
        max={100}
        value={value}
        onChange={(next) => controls.onChange(effect, next)}
        onCommit={controls.onCommit}
        className={`w-[120px] cursor-pointer accent-accent ${FOCUS_RING}`}
      />
      {/* The value as text (the slider announces it itself, so screen readers skip this). */}
      <b aria-hidden className="w-7 text-right tabular-nums">
        {value}
      </b>
    </div>
  );
}
