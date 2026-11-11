type Ctx = RouteContext<"/api/beats/[id]">;

/** GET /api/beats/{id}: a public beat, or your own private one (PRD US-4, US-5). */
export async function GET(_request: Request, ctx: Ctx): Promise<Response> {
  void ctx;
  throw new Error("not implemented");
}

/** PATCH /api/beats/{id}: update title, pattern, or visibility (owner only). */
export async function PATCH(request: Request, ctx: Ctx): Promise<Response> {
  void request;
  void ctx;
  throw new Error("not implemented");
}

/** DELETE /api/beats/{id}: delete a beat (owner only). */
export async function DELETE(_request: Request, ctx: Ctx): Promise<Response> {
  void ctx;
  throw new Error("not implemented");
}
