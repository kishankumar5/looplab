import { handlers } from "@/lib/auth";

// Auth.js endpoints: /api/auth/signin, /signout, /session, /csrf, /callback/credentials, ...
export const { GET, POST } = handlers;
