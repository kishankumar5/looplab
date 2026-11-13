import { useEffect } from "react";

/** Focused elements that already use Space themselves: cells, buttons, sliders, text fields, links. */
const USES_SPACE = "button, input, textarea, select, a[href], [contenteditable]";

/**
 * Calls `onSpace` when Space is pressed and focus is not on a cell, button, or input (PRD US-2),
 * and stops the page from scrolling. Holding the key down doesn't repeat.
 */
export function useSpaceShortcut(onSpace: () => void): void {
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key !== " " || event.repeat || event.defaultPrevented) return;
      if (event.ctrlKey || event.metaKey || event.altKey) return;
      if (event.target instanceof Element && event.target.closest(USES_SPACE)) return;
      event.preventDefault();
      onSpace();
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onSpace]);
}
