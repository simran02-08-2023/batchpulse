import Link from "next/link";
import { signOut } from "@/app/auth/actions";

export function NavBar({ email }: { email: string }) {
  return (
    <header className="border-b border-slate-800 bg-slate-950">
      <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-4 px-6 py-4">
        <div className="flex items-center gap-8">
          <span className="text-sm font-bold tracking-wide text-violet-400">
            BATCHPULSE
          </span>
          <nav className="flex items-center gap-5 text-sm font-medium">
            <Link href="/dashboard" className="text-slate-300 hover:text-white">
              Dashboard
            </Link>
            <Link href="/batches" className="text-slate-300 hover:text-white">
              Batches
            </Link>
          </nav>
        </div>

        <div className="flex items-center gap-4">
          <span className="hidden text-sm text-slate-400 sm:inline">
            {email}
          </span>
          <form action={signOut}>
            <button
              type="submit"
              className="rounded-lg border border-slate-700 px-4 py-2 text-sm font-semibold hover:border-violet-400"
            >
              Sign out
            </button>
          </form>
        </div>
      </div>
    </header>
  );
}