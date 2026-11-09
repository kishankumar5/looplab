import { z } from "zod";

// Stub for the red step: real exports and types, no rules yet.
export const registerSchema = z.object({
  email: z.string(),
  displayName: z.string(),
  password: z.string(),
});

export const signInSchema = z.object({
  email: z.string(),
  password: z.string(),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type SignInInput = z.infer<typeof signInSchema>;
