import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { BatchWithCount } from "@/lib/types";

export default async function BatchesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; error?: string }>;
}) {
  const { q, error: errorParam } = await searchParams;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  let query = supabase
    .from("batches")
    .select("*, enrollments(count)")
    .eq("teacher_id", user!.id)
    .order("created_at", { ascending: false });

  if (q) {
    query = query.or(
      `name.ilike.%${q}%,subject.ilike.%${q}%,grade.ilike.%${q}%`
    );
  }

  const { data: batches, error } = await query;

  return (
    <main className="min-h-screen bg-slate-950 px-6 py-12 text-white">
      <section className="mx-auto w-full max-w-5xl">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold">Batches</h1>
            <p className="mt-1 text-slate-400">
              Manage your classes and track attendance.
            </p>
          </div>
          <Link
            href="/batches/new"
            className="rounded-lg bg-violet-500 px-5 py-2.5 font-semibold hover:bg-violet-400"
          >
            + New batch
          </Link>
        </div>

        <form className="mt-6" action="/batches" method="get">
          <input
            type="text"
            name="q"
            defaultValue={q || ""}
            placeholder="Search by name, subject, or grade…"
            className="w-full max-w-md rounded-lg border border-slate-700 bg-slate-900 px-4 py-2.5 outline-none focus:border-violet-400"
          />
        </form>

        {errorParam ? (
          <p className="mt-6 rounded-lg border border-red-900 bg-red-950/50 p-3 text-sm text-red-200">
            {errorParam}
          </p>
        ) : null}

        {error ? (
          <div className="mt-8 rounded-xl border border-red-900 bg-red-950/30 p-8 text-center">
            <p className="text-red-200">Could not load your batches.</p>
            <Link
              href="/batches"
              className="mt-3 inline-block text-sm font-semibold text-violet-300"
            >
              Try again
            </Link>
          </div>
        ) : !batches || batches.length === 0 ? (
          <div className="mt-8 rounded-xl border border-slate-800 bg-slate-900 p-12 text-center">
            <p className="text-lg font-semibold">
              {q ? "No batches match your search" : "No batches yet"}
            </p>
            <p className="mt-2 text-slate-400">
              {q
                ? "Try a different search term."
                : "Create your first batch to start tracking attendance."}
            </p>
            {q ? (
              <Link
                href="/batches"
                className="mt-5 inline-block text-sm font-semibold text-violet-300"
              >
                Clear search
              </Link>
            ) : (
              <Link
                href="/batches/new"
                className="mt-5 inline-block rounded-lg bg-violet-500 px-5 py-2.5 font-semibold hover:bg-violet-400"
              >
                + Create batch
              </Link>
            )}
          </div>
        ) : (
          <ul className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {(batches as BatchWithCount[]).map((batch) => (
              <li key={batch.id}>
                <Link
                  href={`/batches/${batch.id}`}
                  className="block h-full rounded-xl border border-slate-800 bg-slate-900 p-5 transition hover:border-violet-500"
                >
                  <h2 className="text-lg font-semibold">{batch.name}</h2>
                  <p className="mt-1 text-sm text-slate-400">
                    {batch.subject} · Grade {batch.grade}
                  </p>
                  {batch.schedule ? (
                    <p className="mt-2 text-sm text-slate-500">
                      {batch.schedule}
                    </p>
                  ) : null}
                  <p className="mt-4 text-sm font-medium text-violet-300">
                    {batch.enrollments?.[0]?.count ?? 0} student
                    {batch.enrollments?.[0]?.count === 1 ? "" : "s"}
                  </p>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}