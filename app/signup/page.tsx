import Link from "next/link";
import { signUp } from "../auth/actions";

type SignupPageProps = {
  searchParams: Promise<{ error?: string }>;
};

export default async function SignupPage({ searchParams }: SignupPageProps) {
  const { error } = await searchParams;

  return (
    <main className="min-h-screen bg-slate-950 px-6 py-16 text-white">
      <section className="mx-auto w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900 p-8">
        <Link href="/" className="text-sm font-semibold text-violet-300">
          ← Back to BatchPulse
        </Link>

        <h1 className="mt-8 text-3xl font-bold">Create your workspace</h1>
        <p className="mt-2 text-slate-400">
          Start tracking student progress in one place.
        </p>

        {error ? (
          <p className="mt-5 rounded-lg border border-red-900 bg-red-950/50 p-3 text-sm text-red-200">
            {error}
          </p>
        ) : null}

        <form action={signUp} className="mt-8 space-y-5">
          <label className="block">
            <span className="text-sm font-medium">Full name</span>
            <input
              name="fullName"
              type="text"
              required
              minLength={2}
              className="mt-2 w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 outline-none focus:border-violet-400"
              placeholder="Your name"
            />
          </label>

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

          <label className="block">
            <span className="text-sm font-medium">Password</span>
            <input
              name="password"
              type="password"
              required
              minLength={6}
              className="mt-2 w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 outline-none focus:border-violet-400"
              placeholder="At least 6 characters"
            />
          </label>

          <button
            type="submit"
            className="w-full rounded-lg bg-violet-500 px-5 py-3 font-semibold transition hover:bg-violet-400"
          >
            Create account
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-slate-400">
          Already have an account?{" "}
          <Link href="/login" className="font-semibold text-violet-300">
            Sign in
          </Link>
        </p>
      </section>
    </main>
  );
}