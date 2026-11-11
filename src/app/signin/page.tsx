import type { Metadata } from "next";
import { Suspense } from "react";
import { AuthForm } from "@/components/auth/AuthForm";

export const metadata: Metadata = { title: "Sign in · LoopLab" };

export default function SignInPage() {
  return (
    <main className="px-4">
      <Suspense>
        <AuthForm mode="signin" />
      </Suspense>
    </main>
  );
}
