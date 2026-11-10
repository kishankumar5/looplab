"use client";

import { useEffect, useRef } from "react";
import "swagger-ui-dist/swagger-ui.css";

/**
 * Interactive API docs (PRD US-7). "Try it out" calls this deployment with your session cookie.
 * Uses swagger-ui-dist's prebuilt bundle: swagger-ui-react's OpenAPI 3.1 parser breaks under Turbopack
 * (operations never finish loading).
 */
export function SwaggerDocs() {
  const container = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let cancelled = false;
    // @ts-expect-error: the prebuilt bundle has no type declarations
    import("swagger-ui-dist/swagger-ui-bundle").then(({ default: SwaggerUIBundle }) => {
      if (cancelled || !container.current) return;
      SwaggerUIBundle({ url: "/api/openapi", domNode: container.current, docExpansion: "list", deepLinking: true });
    });
    return () => {
      cancelled = true;
    };
  }, []);

  return <div ref={container} />;
}
