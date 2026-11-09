"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import { useState, type FormEvent } from "react";

type Mode = "signin" | "register";

const inputClasses =
  "rounded-lg border border-line bg-panel-2 px-3 py-2.5 text-text focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-2";

/** Sign-in and registration form (mockup "Sign in" screen, PRD US-1). */
export function AuthForm({ mode }: { mode: Mode }) {
  const router = useRouter();
  const callbackUrl = useSearchParams().get("callbackUrl") ?? "/";
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setPending(true);
    const form = new FormData(event.currentTarget);
    const email = String(form.get("email"));
    const password = String(form.get("password"));

    if (mode === "register") {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email, password, displayName: String(form.get("displayName")) }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        setError(body?.error?.message ?? "Something went wrong. Please try again.");
        setPending(false);
        return;
      }
    }

    const result = await signIn("credentials", { email, password, redirect: false });
    if (result?.error) {
      setError("Wrong email or password.");
      setPending(false);
      return;
    }
    router.push(callbackUrl);
    router.refresh();
  }

  const isRegister = mode === "register";
  return (
    <form
      onSubmit={handleSubmit}
      className="mx-auto mt-8 flex w-full max-w-[380px] flex-col gap-3 rounded-[10px] bg-panel p-6"
    >
      <h1 className="text-xl font-bold">{isRegister ? "Create your account" : "Sign in to save your beat"}</h1>
      <label className="flex flex-col gap-1 text-sm text-muted">
        Email
        <input name="email" type="email" autoComplete="email" required className={inputClasses} />
      </label>
      {isRegister && (
        <label className="flex flex-col gap-1 text-sm text-muted">
          Display name
          <input name="displayName" autoComplete="nickname" required maxLength={40} className={inputClasses} />
        </label>
      )}
      <label className="flex flex-col gap-1 text-sm text-muted">
        Password
        <input
          name="password"
          type="password"
          autoComplete={isRegister ? "new-password" : "current-password"}
          required
          minLength={isRegister ? 8 : undefined}
          className={inputClasses}
        />
      </label>
      {error && (
        <p role="alert" className="text-sm text-danger">
          {error}
        </p>
      )}
      <button
        type="submit"
        disabled={pending}
        className="rounded-lg bg-accent px-4 py-2 font-bold text-on-accent disabled:opacity-60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-2"
      >
        {isRegister ? "Create account" : "Sign in"}
      </button>
      <p className="text-sm text-muted">
        {isRegister ? (
          <>
            Already have an account? <Link href="/signin" className="text-accent-2">Sign in</Link>.
          </>
        ) : (
          <>
            New here? <Link href="/register" className="text-accent-2">Create an account</Link>. Your unsaved beat
            will be kept.
          </>
        )}
      </p>
    </form>
  );
}
