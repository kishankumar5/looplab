import { useEffect } from "react";

/** Input types you type into: they keep Cmd/Ctrl+Z for undoing their own text. */
const TEXT_INPUT_TYPES = new Set(["text", "search", "email", "url", "tel", "password", "number"]);

function isTextField(target: EventTarget | null): boolean {
  if (!(target instanceof Element)) return false;
  if (target instanceof HTMLTextAreaElement) return true;
  if (target instanceof HTMLInputElement) return TEXT_INPUT_TYPES.has(target.type);
  return target.closest("[contenteditable]:not([contenteditable='false'])") !== null;
}

/** Cmd/Ctrl+Z undoes; Shift+Cmd/Ctrl+Z and Ctrl+Y redo (PRD US-3). */
function shortcutFor(event: KeyboardEvent): "undo" | "redo" | null {
  if (event.altKey) return null;
  // Chrome's autofill sends keydown events without a key.
  const key = event.key?.toLowerCase();
  if ((event.metaKey || event.ctrlKey) && key === "z") return event.shiftKey ? "redo" : "undo";
  if (event.ctrlKey && !event.shiftKey && key === "y") return "redo";
  return null;
}

/** Undo and redo from the keyboard anywhere on the page, except while typing in a text field. */
export function useUndoShortcuts(undo: () => void, redo: () => void): void {
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.defaultPrevented || isTextField(event.target)) return;
      const shortcut = shortcutFor(event);
      if (!shortcut) return;
      event.preventDefault();
      if (shortcut === "undo") undo();
      else redo();
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [undo, redo]);
}
