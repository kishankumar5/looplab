import { useEffect, useRef, type InputHTMLAttributes } from "react";

type NativeProps = Omit<InputHTMLAttributes<HTMLInputElement>, "type" | "value" | "min" | "max" | "onChange">;

export interface RangeInputProps extends NativeProps {
  value: number;
  min: number;
  max: number;
  /** Every movement, with the new whole-number value. */
  onChange: (value: number) => void;
  /** Let go (or nudged with an arrow key): the moment a drag becomes one undo step. */
  onCommit: () => void;
}

/**
 * A slider whose whole drag counts as one change (PRD US-3). React's onChange fires on every
 * movement; the native change event fires once, when the user lets go (or per arrow key press),
 * so that's onCommit.
 */
export function RangeInput({ value, onChange, onCommit, ...rest }: RangeInputProps) {
  const input = useRef<HTMLInputElement>(null);
  useEffect(() => {
    const slider = input.current;
    slider?.addEventListener("change", onCommit);
    return () => slider?.removeEventListener("change", onCommit);
  }, [onCommit]);
  return (
    <input
      ref={input}
      type="range"
      step={1}
      value={value}
      onChange={(event) => onChange(Number(event.target.value))}
      {...rest}
    />
  );
}
