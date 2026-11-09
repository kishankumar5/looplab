import type { Metadata } from "next";
import { Suspense } from "react";
import { AuthForm } from "@/components/auth/AuthForm";

export const metadata: Metadata = { title: "Create an account · LoopLab" };

export default function RegisterPage() {
  return (
    <main className="px-4">
      <Suspense>
        <AuthForm mode="register" />
      </Suspense>
    </main>
  );
}
