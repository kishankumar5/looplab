import { RangeInput } from "@/components/ui/RangeInput";
import type { TrackId } from "@/lib/validation/beat";
import { TRACK_LOOKS } from "./tracks";

export interface TrackHeaderControls {
  onVolumeChange: (volume: number) => void;
  /** The volume slider was let go: one history entry. */
  onVolumeCommit: () => void;
  onToggleMute: () => void;
}

export interface TrackHeaderProps {
  track: TrackId;
  volume: number;
  muted: boolean;
  /** Leave it out on a read-only grid: the name, plus "Muted" when the row is muted. */
  controls?: TrackHeaderControls;
}

const FOCUS_RING = "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-2";

/** A row's header (mockup Editor screen): name, volume slider (0 to 100), and Mute (PRD US-3). */
export function TrackHeader({ track, volume, muted, controls }: TrackHeaderProps) {
  const look = TRACK_LOOKS[track];
  return (
    <div className="flex items-center gap-1.5 text-sm">
      <span aria-hidden className={`size-2 shrink-0 rounded-full ${look.dot}`} />
      <span className="w-[52px] shrink-0">{look.name}</span>
      {controls ? (
        <>
          <RangeInput
            aria-label={`${look.name} volume`}
            min={0}
            max={100}
            value={volume}
            onChange={controls.onVolumeChange}
            onCommit={controls.onVolumeCommit}
            className={`w-[60px] cursor-pointer accent-accent-2 ${FOCUS_RING}`}
          />
          {/* The value as text (the slider announces it itself, so screen readers skip this). */}
          <span aria-hidden className="w-6 text-right text-xs text-muted tabular-nums">
            {volume}
          </span>
          <button
            type="button"
            aria-label={`Mute ${look.name}`}
            aria-pressed={muted}
            title={`Mute ${look.name}`}
            onClick={controls.onToggleMute}
            className={`cursor-pointer rounded-md border border-line px-1.5 py-0.5 text-[11px] text-muted aria-pressed:border-danger aria-pressed:bg-danger aria-pressed:text-on-danger ${FOCUS_RING}`}
          >
            M
          </button>
        </>
      ) : (
        muted && <span className="rounded-md border border-line px-1.5 py-0.5 text-[11px] text-muted">Muted</span>
      )}
    </div>
  );
}
