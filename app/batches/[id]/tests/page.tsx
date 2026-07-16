import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export default async function TestsPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const { id } = await params;
  const { error: errorParam } = await searchParams;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: batch } = await supabase
    .from("batches")
    .select("id, name")
    .eq("id", id)
    .eq("teacher_id", user!.id)
    .single();

  if (!batch) {
    notFound();
  }

  const { data: tests, error } = await supabase
    .from("tests")
    .select("*")
    .eq("batch_id", id)
    .order("test_date", { ascending: false });

  const testsWithStats = await Promise.all(
    (tests || []).map(async (test) => {
      const { data: results } = await supabase
        .from("test_results")
        .select("marks")
        .eq("test_id", test.id);

      const marksList = (results || []).map((r) => Number(r.marks));
      const count = marksList.length;
      const avg =
        count > 0
          ? Math.round((marksList.reduce((a, b) => a + b, 0) / count) * 10) / 10
          : null;
      const high = count > 0 ? Math.max(...marksList) : null;
      const low = count > 0 ? Math.min(...marksList) : null;

      return { ...test, count, avg, high, low };
    })
  );

  return (
    <main className="min-h-screen bg-slate-950 px-6 py-12 text-white">
      <section className="mx-auto w-full max-w-3xl">
        <Link
          href={`/batches/${id}`}
          className="text-sm font-semibold text-violet-300"
        >
          ← Back to {batch.name}
        </Link>

        <div className="mt-6 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold">Tests</h1>
            <p className="mt-1 text-slate-400">{batch.name}</p>
          </div>
          <Link
            href={`/batches/${id}/tests/new`}
            className="rounded-lg bg-violet-500 px-5 py-2.5 font-semibold hover:bg-violet-400"
          >
            + Schedule test
          </Link>
        </div>

        {errorParam ? (
          <p className="mt-6 rounded-lg border border-red-900 bg-red-950/50 p-3 text-sm text-red-200">
            {errorParam}
          </p>
        ) : null}

        {error ? (
          <div className="mt-8 rounded-xl border border-red-900 bg-red-950/30 p-8 text-center">
            <p className="text-red-200">Could not load tests.</p>
            <Link
              href={`/batches/${id}/tests`}
              className="mt-3 inline-block text-sm font-semibold text-violet-300"
            >
              Try again
            </Link>
          </div>
        ) : testsWithStats.length === 0 ? (
          <div className="mt-8 rounded-xl border border-slate-800 bg-slate-900 p-12 text-center">
            <p className="text-lg font-semibold">No tests scheduled yet</p>
            <p className="mt-2 text-slate-400">
              Schedule a test to start recording marks.
            </p>
            <Link
              href={`/batches/${id}/tests/new`}
              className="mt-5 inline-block rounded-lg bg-violet-500 px-5 py-2.5 font-semibold hover:bg-violet-400"
            >
              + Schedule test
            </Link>
          </div>
        ) : (
          <ul className="mt-8 divide-y divide-slate-800 rounded-xl border border-slate-800 bg-slate-900">
            {testsWithStats.map((test) => (
              <li key={test.id}>
                <Link
                  href={`/batches/${id}/tests/${test.id}`}
                  className="flex flex-wrap items-center justify-between gap-3 px-5 py-4 hover:bg-slate-800/50"
                >
                  <div>
                    <p className="font-medium">{test.title}</p>
                    <p className="text-sm text-slate-400">
                      {new Date(
                        test.test_date + "T00:00:00"
                      ).toLocaleDateString("en-IN", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}{" "}
                      · Max marks: {test.max_marks}
                    </p>
                  </div>
                  {test.count > 0 ? (
                    <div className="text-right text-sm">
                      <p className="font-semibold text-violet-300">
                        Avg: {test.avg}/{test.max_marks}
                      </p>
                      <p className="text-slate-500">
                        High: {test.high} · Low: {test.low}
                      </p>
                    </div>
                  ) : (
                    <span className="rounded-full bg-slate-800 px-3 py-1 text-xs font-semibold text-slate-400">
                      No marks entered
                    </span>
                  )}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}