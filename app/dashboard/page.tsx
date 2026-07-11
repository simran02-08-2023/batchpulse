import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { NavBar } from "@/components/NavBar";

export default async function DashboardPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: batches } = await supabase
    .from("batches")
    .select("id")
    .eq("teacher_id", user!.id);

  const batchIds = (batches || []).map((b) => b.id);

  let activeStudentCount = 0;

  if (batchIds.length > 0) {
    const { data: enrollments } = await supabase
      .from("enrollments")
      .select("student_id")
      .in("batch_id", batchIds)
      .eq("status", "active");

    activeStudentCount = new Set(
      (enrollments || []).map((e) => e.student_id)
    ).size;
  }

  const hasBatches = batchIds.length > 0;

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <NavBar email={user.email || ""} />

      <main className="px-6 py-10">
        <section className="mx-auto max-w-6xl">
          <div>
            <h1 className="text-3xl font-bold">Dashboard</h1>
            <p className="mt-2 text-slate-400">Signed in as {user.email}</p>
          </div>

          <section className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {[
              ["Active students", String(activeStudentCount)],
              ["Batches", String(batchIds.length)],
              ["Today's attendance", "—"],
              ["Needs attention", "0"],
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

          {hasBatches ? (
            <section className="mt-8 flex flex-wrap items-center justify-between gap-4 rounded-xl border border-slate-800 bg-slate-900 p-6">
              <div>
                <h2 className="text-lg font-semibold">Your batches</h2>
                <p className="mt-1 text-slate-400">
                  Manage classes, students, and attendance.
                </p>
              </div>
              <Link
                href="/batches"
                className="rounded-lg bg-violet-500 px-5 py-2.5 font-semibold hover:bg-violet-400"
              >
                View batches →
              </Link>
            </section>
          ) : (
            <section className="mt-8 rounded-xl border border-dashed border-slate-700 bg-slate-900/50 p-8">
              <h2 className="text-xl font-semibold">Your workspace is ready</h2>
              <p className="mt-2 text-slate-400">
                Create your first batch to start tracking real academic
                data.
              </p>
              <Link
                href="/batches/new"
                className="mt-5 inline-block rounded-lg bg-violet-500 px-5 py-2.5 font-semibold hover:bg-violet-400"
              >
                + Create your first batch
              </Link>
            </section>
          )}
        </section>
      </main>
    </div>
  );
}