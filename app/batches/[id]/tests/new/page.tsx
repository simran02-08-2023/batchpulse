import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createTest } from "@/app/batches/[id]/tests/actions";

export default async function NewTestPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const { id } = await params;
  const { error } = await searchParams;
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

  const createTestWithId = createTest.bind(null, id);

  return (
    <main className="min-h-screen bg-slate-950 px-6 py-16 text-white">
      <section className="mx-auto w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900 p-8">
        <Link
          href={`/batches/${id}/tests`}
          className="text-sm font-semibold text-violet-300"
        >
          ← Back to tests
        </Link>

        <h1 className="mt-8 text-3xl font-bold">Schedule a test</h1>
        <p className="mt-2 text-slate-400">For {batch.name}.</p>

        {error ? (
          <p className="mt-5 rounded-lg border border-red-900 bg-red-950/50 p-3 text-sm text-red-200">
            {error}
          </p>
        ) : null}

        <form action={createTestWithId} className="mt-8 space-y-5">
          <label className="block">
            <span className="text-sm font-medium">Test title</span>
            <input
              type="text"
              name="title"
              required
              placeholder="e.g. Unit Test 1: Algebra"
              className="mt-2 w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 outline-none focus:border-violet-400"
            />
          </label>

          <label className="block">
            <span className="text-sm font-medium">Test date</span>
            <input
              type="date"
              name="test_date"
              required
              className="mt-2 w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 outline-none focus:border-violet-400"
            />
          </label>

          <label className="block">
            <span className="text-sm font-medium">Max marks</span>
            <input
              type="number"
              name="max_marks"
              required
              min={1}
              placeholder="e.g. 50"
              className="mt-2 w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 outline-none focus:border-violet-400"
            />
          </label>

          <button
            type="submit"
            className="w-full rounded-lg bg-violet-500 px-5 py-3 font-semibold hover:bg-violet-400"
          >
            Schedule test
          </button>
        </form>
      </section>
    </main>
  );
}