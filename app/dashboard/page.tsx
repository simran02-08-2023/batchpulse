import { redirect } from "next/navigation";
import { signOut } from "../auth/actions";
import { createClient } from "@/lib/supabase/server";

export default async function DashboardPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <main className="min-h-screen bg-slate-950 px-6 py-10 text-white">
      <section className="mx-auto max-w-6xl">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-sm font-semibold tracking-widest text-violet-300">
              BATCHPULSE
            </p>
            <h1 className="mt-2 text-3xl font-bold">Dashboard</h1>
            <p className="mt-2 text-slate-400">
              Signed in as {user.email}
            </p>
          </div>

          <form action={signOut}>
            <button
              type="submit"
              className="rounded-lg border border-slate-700 px-4 py-2 font-semibold text-slate-200 hover:bg-slate-900"
            >
              Sign out
            </button>
          </form>
        </div>

        <section className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {[
            ["Active students", "0"],
            ["Today’s attendance", "—"],
            ["Needs attention", "0"],
            ["Homework pending", "0"],
          ].map(([label, value]) => (
            <article
              key={label}
              className="rounded-xl border border-slate-800 bg-slate-900 p-5"
            >
              <p className="text-sm text-slate-400">{label}</p>
              <p className="mt-3 text-3xl font-bold">{value}</p>
            </article>
          ))}
        </section>

        <section className="mt-8 rounded-xl border border-dashed border-slate-700 bg-slate-900/50 p-8">
          <h2 className="text-xl font-semibold">Your workspace is ready</h2>
          <p className="mt-2 text-slate-400">
            Next, create batches and add students to start tracking real
            academic data.
          </p>
        </section>
      </section>
    </main>
  );
}