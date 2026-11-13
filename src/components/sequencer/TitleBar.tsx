export interface TitleBarProps {
  title: string;
  bpm: number;
}

/** The title area above the transport (mockup Editor title bar): the beat's name and tempo. */
export function TitleBar({ title, bpm }: TitleBarProps) {
  return (
    <div className="mb-3.5 flex flex-wrap items-center gap-3">
      {/* TODO(#8): swap this for SaveBar's editable title and Save button. */}
      <h1 className="min-w-0 truncate py-1 text-[22px] font-bold">{title}</h1>
      <span className="rounded-full border border-line px-2.5 py-1 text-xs text-muted">{bpm} BPM</span>
    </div>
  );
}
