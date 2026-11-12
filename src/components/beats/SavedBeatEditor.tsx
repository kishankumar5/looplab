export interface SavedBeatEditorProps {
  params: Promise<{ id: string }>;
}

/**
 * The editor for a saved beat at /beats/{id}, for its owner only. Reads the session, so render it
 * inside <Suspense>. Anyone else, and any unknown id, gets the 404 page.
 */
export async function SavedBeatEditor(props: SavedBeatEditorProps): Promise<React.JSX.Element> {
  void props;
  throw new Error("not implemented");
}
