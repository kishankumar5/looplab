/** Track order for previews, matching the editor's rows (PRD US-2). */
export const PREVIEW_TRACKS = ["kick", "snare", "hihat", "bass", "synth"] as const;
export const PREVIEW_STEPS = 16;

/**
 * Turns a saved pattern into a 5x16 grid of on/off cells for the gallery's mini preview.
 * Defensive on purpose: saved JSON may be from an older version, so anything missing shows as "off".
 */
export function previewRows(pattern: unknown): boolean[][] {
  const tracks = (pattern as { tracks?: Record<string, { steps?: unknown }> } | null)?.tracks ?? {};
  return PREVIEW_TRACKS.map((id) => {
    const steps = Array.isArray(tracks[id]?.steps) ? (tracks[id].steps as unknown[]) : [];
    return Array.from({ length: PREVIEW_STEPS }, (_, i) => steps[i] === true);
  });
}
