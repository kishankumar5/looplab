export interface SharedBeatProps {
  params: Promise<{ id: string }>;
}

/**
 * The content of /b/{id}: a public beat for anyone, or your own beat. Reads the session, so render
 * it inside <Suspense>. A private beat that isn't yours, and any unknown id, gets the 404 page.
 */
export async function SharedBeat(props: SharedBeatProps): Promise<React.JSX.Element> {
  void props;
  throw new Error("not implemented");
}
