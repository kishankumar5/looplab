import "dotenv/config";
import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterEach } from "vitest";

// Node 25+ ships its own (file-backed, usually unusable) localStorage, which hides jsdom's.
// Point tests back at jsdom's so browser code sees a normal Storage.
const jsdom = (globalThis as { jsdom?: { window: Window } }).jsdom;
if (jsdom && typeof globalThis.localStorage?.clear !== "function") {
  Object.defineProperty(globalThis, "localStorage", { value: jsdom.window.localStorage, configurable: true });
}

afterEach(() => {
  cleanup();
});
