import type { Metadata } from "next";
import { SwaggerDocs } from "./SwaggerDocs";

export const metadata: Metadata = { title: "API docs · LoopLab" };

export default function ApiDocsPage() {
  // Swagger UI ships its own light theme, so it gets a white panel inside our dark page.
  return (
    <main className="mx-auto my-6 w-full max-w-[1100px] rounded-[10px] bg-white px-2 py-2 text-black">
      <SwaggerDocs />
    </main>
  );
}
