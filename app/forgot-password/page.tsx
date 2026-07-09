import Link from "next/link";
import { requestPasswordReset } from "../auth/actions";

type Props = {
  searchParams: Promise<{ error?: string; sent?: string }>;
};

export default async function ForgotPasswordPage({ searchParams }: Props) {
  const { error, sent } = await searchParams;

  return (
    <main className="min-h-screen bg-slate-950 px-6 py-16 text-white">
      <section className="mx-auto w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900 p-8">
        <Link href="/login" className="text-sm font-semibold text-violet-300">
          ← Back to sign in
        </Link>

        <h1 className="mt-8 text-3xl font-bold">Reset your password</h1>
        <p className="mt-2 text-slate-400">
          Enter your email and we’ll send a secure reset link.
        </p>

        {sent ? (
          <p className="mt-5 rounded-lg border border-emerald-900 bg-emerald-950/50 p-3 text-sm text-emerald-200">
            If an account exists for that email, a reset link has been sent.
          </p>
        ) : null}

        {error ? (
          <p className="mt-5 rounded-lg border border-red-900 bg-red-950/50 p-3 text-sm text-red-200">
            {error}
          </p>
        ) : null}

        <form action={requestPasswordReset} className="mt-8 space-y-5">
          <label className="block">
            <span className="text-sm font-medium">Email</span>
            <input
              name="email"
              type="email"
              required
              className="mt-2 w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 outline-none focus:border-violet-400"
              placeholder="you@example.com"
            />
          </label>

          <button
            type="submit"
            className="w-full rounded-lg bg-violet-500 px-5 py-3 font-semibold hover:bg-violet-400"
          >
            Send reset link
          </button>
        </form>
      </section>
    </main>
  );
}