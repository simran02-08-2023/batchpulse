"use client";

import Link from "next/link";
import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [ready, setReady] = useState(false);
  const [error, setError] = useState(searchParams.get("error") || "");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const supabase = createClient();

    async function verifyRecoverySession() {
      const code = searchParams.get("code");

      if (code) {
        const { error: exchangeError } =
          await supabase.auth.exchangeCodeForSession(code);

        if (exchangeError) {
          console.error("Exchange code error:", exchangeError.message);
          setError(
            "This reset link is invalid or has expired. Request a new one."
          );
          setReady(true);
          return;
        }

        setReady(true);
        return;
      }

      const { data, error: sessionError } = await supabase.auth.getSession();

      if (sessionError || !data.session) {
        setError(
          "This reset link is invalid or has expired. Request a new one."
        );
        setReady(true);
        return;
      }

      setReady(true);
    }

    verifyRecoverySession();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setSubmitting(true);
    setError("");

    const supabase = createClient();

    const { error: updateError } = await supabase.auth.updateUser({
      password,
    });

    if (updateError) {
      setError("Could not update password. Request a new reset link and try again.");
      setSubmitting(false);
      return;
    }

    await supabase.auth.signOut();
    router.replace("/login?message=Password%20updated.%20Please%20sign%20in.");
  }

  return (
    <main className="min-h-screen bg-slate-950 px-6 py-16 text-white">
      <section className="mx-auto w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900 p-8">
        <Link href="/login" className="text-sm font-semibold text-violet-300">
          ← Back to sign in
        </Link>

        <h1 className="mt-8 text-3xl font-bold">Choose a new password</h1>
        <p className="mt-2 text-slate-400">Use at least 6 characters.</p>

        {!ready ? (
          <p className="mt-8 text-slate-300">Verifying your reset link…</p>
        ) : (
          <>
            {error ? (
              <p className="mt-5 rounded-lg border border-red-900 bg-red-950/50 p-3 text-sm text-red-200">
                {error}
              </p>
            ) : null}

            <form onSubmit={handleSubmit} className="mt-8 space-y-5">
              <label className="block">
                <span className="text-sm font-medium">New password</span>
                <input
                  type="password"
                  required
                  minLength={6}
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  className="mt-2 w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 outline-none focus:border-violet-400"
                />
              </label>

              <label className="block">
                <span className="text-sm font-medium">Confirm new password</span>
                <input
                  type="password"
                  required
                  minLength={6}
                  value={confirmPassword}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                  className="mt-2 w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 outline-none focus:border-violet-400"
                />
              </label>

              <button
                type="submit"
                disabled={submitting}
                className="w-full rounded-lg bg-violet-500 px-5 py-3 font-semibold hover:bg-violet-400 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {submitting ? "Updating password…" : "Update password"}
              </button>
            </form>

            {error ? (
              <Link
                href="/forgot-password"
                className="mt-5 block text-center text-sm font-semibold text-violet-300"
              >
                Request a new reset link
              </Link>
            ) : null}
          </>
        )}
      </section>
    </main>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen bg-slate-950 px-6 py-16 text-white">
          <section className="mx-auto w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900 p-8">
            <p className="text-slate-300">Loading password reset…</p>
          </section>
        </main>
      }
    >
      <ResetPasswordForm />
    </Suspense>
  );
}