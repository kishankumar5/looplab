import { z } from "zod";

const email = z.string().trim().toLowerCase().pipe(z.email("Enter a valid email"));

/** Registration form and POST /api/auth/register body (PRD US-1). */
export const registerSchema = z.object({
  email,
  displayName: z
    .string()
    .trim()
    .min(1, "Display name is required")
    .max(40, "Display name must be 40 characters or fewer"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(100, "Password must be 100 characters or fewer"),
});

/** Sign-in form (checked again inside the Auth.js credentials provider). */
export const signInSchema = z.object({
  email,
  password: z.string().min(1, "Password is required"),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type SignInInput = z.infer<typeof signInSchema>;
