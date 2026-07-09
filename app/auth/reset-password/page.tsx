import Link from "next/link";
import { updatePassword } from "../actions";

type Props = {
  searchParams: Promise<{ error?: string }>;
};

export default async function ResetPasswordPage({ searchParams }: Props) {
  const { error } = await searchParams;

  return (
    <main className="min-h-screen bg-slate-950 px-6 py-16 text-white">
      <section className="mx-auto w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900 p-8">
        <Link href="/login" className="text-sm font-semibold text-violet-300">
          ← Back to sign in
        </Link>

        <h1 className="mt-8 text-3xl font-bold">Choose a new password</h1>
        <p className="mt-2 text-slate-400">
          Use at least 6 characters.
        </p>

        {error ? (
          <p className="mt-5 rounded-lg border border-red-900 bg-red-950/50 p-3 text-sm text-red-200">
            {error}
          </p>
        ) : null}

        <form action={updatePassword} className="mt-8 space-y-5">
          <label className="block">
            <span className="text-sm font-medium">New password</span>
            <input
              name="password"
              type="password"
              required
              minLength={6}
              className="mt-2 w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 outline-none focus:border-violet-400"
            />
          </label>

          <label className="block">
            <span className="text-sm font-medium">Confirm new password</span>
            <input
              name="confirmPassword"
              type="password"
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
      </section>
    </main>
  );
}