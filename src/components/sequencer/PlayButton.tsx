export interface PlayButtonProps {
  playing: boolean;
  onToggle: () => void;
}

/** The round Play/Stop button (mockup .play): ▶ while stopped, ■ while playing. */
export function PlayButton({ playing, onToggle }: PlayButtonProps) {
  return (
    <button
      type="button"
      aria-label={playing ? "Stop" : "Play"}
      onClick={onToggle}
      className="grid size-12 cursor-pointer place-items-center rounded-full bg-accent text-lg font-black text-on-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-2"
    >
      {/* ▶ sits a touch left of centre in most fonts; nudge it. */}
      <span aria-hidden className={playing ? "" : "translate-x-px"}>
        {playing ? "■" : "▶"}
      </span>
    </button>
  );
}
