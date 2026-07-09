"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function AuthCallbackPage() {
  const router = useRouter();

  useEffect(() => {
    const supabase = createClient();

    async function finishRecovery() {
      const { error } = await supabase.auth.getSession();

      if (error) {
        router.replace(
          "/auth/reset-password?error=This%20reset%20link%20is%20invalid%20or%20has%20expired.%20Request%20a%20new%20one."
        );
        return;
      }

      router.replace("/auth/reset-password");
    }

    finishRecovery();
  }, [router]);

  return (
    <main className="min-h-screen bg-slate-950 px-6 py-16 text-white">
      <section className="mx-auto w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900 p-8 text-center">
        <h1 className="text-2xl font-bold">Verifying reset link…</h1>
        <p className="mt-3 text-slate-400">Please wait while we securely open your password reset page.</p>
      </section>
    </main>
  );
}