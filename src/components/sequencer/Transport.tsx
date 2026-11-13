export interface TransportProps {
  onClear: () => void;
}

/** The bar above the grid (mockup Editor screen). */
export function Transport({ onClear }: TransportProps) {
  return (
    <div className="mb-3 flex flex-wrap items-center gap-4 rounded-[10px] bg-panel px-3.5 py-3">
      {/* TODO(#6): Play/Stop button and Tempo slider */}
      <span className="flex-1" />
      <button
        type="button"
        onClick={onClear}
        className="cursor-pointer rounded-lg border border-line px-3.5 py-2 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-2"
      >
        Clear
      </button>
    </div>
  );
}
