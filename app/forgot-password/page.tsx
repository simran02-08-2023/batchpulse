import Link from "next/link";
import { requestPasswordReset, resetPasswordWithCode } from "../auth/actions";

type Props = {
  searchParams: Promise<{ error?: string; sent?: string; email?: string }>;
};

export default async function ForgotPasswordPage({ searchParams }: Props) {
  const { error, sent, email } = await searchParams;
  const showCodeForm = sent === "1" && !!email;

  return (
    <main className="min-h-screen bg-slate-950 px-6 py-16 text-white">
      <section className="mx-auto w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900 p-8">
        <Link href="/login" className="text-sm font-semibold text-violet-300">
          ← Back to sign in
        </Link>

        {!showCodeForm ? (
          <>
            <h1 className="mt-8 text-3xl font-bold">Reset your password</h1>
            <p className="mt-2 text-slate-400">
              Enter your email and we&apos;ll send you a reset code.
            </p>

            {error ? (
              <p className="mt-5 rounded-lg border border-red-900 bg-red-950/50 p-3 text-sm text-red-200">
                {error}
              </p>
            ) : null}

            <form action={requestPasswordReset} className="mt-8 space-y-5">
              <label className="block">
                <span className="text-sm font-medium">Email</span>
                <input
                  type="email"
                  name="email"
                  required
                  placeholder="you@example.com"
                  className="mt-2 w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 outline-none focus:border-violet-400"
                />
              </label>

              <button
                type="submit"
                className="w-full rounded-lg bg-violet-500 px-5 py-3 font-semibold hover:bg-violet-400"
              >
                Send reset code
              </button>
            </form>
          </>
        ) : (
          <>
            <h1 className="mt-8 text-3xl font-bold">Enter your code</h1>
            <p className="mt-2 text-slate-400">
              We sent a 6-digit code to <span className="text-white">{email}</span>.
              Enter it below with your new password.
            </p>

            {error ? (
              <p className="mt-5 rounded-lg border border-red-900 bg-red-950/50 p-3 text-sm text-red-200">
                {error}
              </p>
            ) : null}

            <form action={resetPasswordWithCode} className="mt-8 space-y-5">
              <input type="hidden" name="email" value={email} />

              <label className="block">
                <span className="text-sm font-medium">Reset code</span>
                <input
                  type="text"
                  name="code"
                  required
                  inputMode="numeric"
                  maxLength={10}
                  placeholder="Enter the code from your email"
                  className="mt-2 w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 text-center text-xl tracking-[0.3em] outline-none focus:border-violet-400"
                />
              </label>

              <label className="block">
                <span className="text-sm font-medium">New password</span>
                <input
                  type="password"
                  name="password"
                  required
                  minLength={6}
                  className="mt-2 w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 outline-none focus:border-violet-400"
                />
              </label>

              <label className="block">
                <span className="text-sm font-medium">Confirm new password</span>
                <input
                  type="password"
                  name="confirmPassword"
                  required
                  minLength={6}
                  className="mt-2 w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 outline-none focus:border-violet-400"
                />
              </label>

              <button
                type="submit"
                className="w-full rounded-lg bg-violet-500 px-5 py-3 font-semibold hover:bg-violet-400"
              >
                Update password
              </button>
            </form>

            <Link
              href="/forgot-password"
              className="mt-5 block text-center text-sm font-semibold text-violet-300"
            >
              Use a different email
            </Link>
          </>
        )}
      </section>
    </main>
  );
}