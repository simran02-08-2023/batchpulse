import Link from "next/link";
import { createBatch } from "@/app/batches/actions";

export default async function NewBatchPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  return (
    <main className="min-h-screen bg-slate-950 px-6 py-16 text-white">
      <section className="mx-auto w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900 p-8">
        <Link href="/batches" className="text-sm font-semibold text-violet-300">
          ← Back to batches
        </Link>

        <h1 className="mt-8 text-3xl font-bold">Create a batch</h1>
        <p className="mt-2 text-slate-400">
          Set up a class to start adding students.
        </p>

        {error ? (
          <p className="mt-5 rounded-lg border border-red-900 bg-red-950/50 p-3 text-sm text-red-200">
            {error}
          </p>
        ) : null}

        <form action={createBatch} className="mt-8 space-y-5">
          <label className="block">
            <span className="text-sm font-medium">Batch name</span>
            <input
              type="text"
              name="name"
              required
              placeholder="e.g. Morning Math Batch"
              className="mt-2 w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 outline-none focus:border-violet-400"
            />
          </label>

          <label className="block">
            <span className="text-sm font-medium">Subject</span>
            <input
              type="text"
              name="subject"
              required
              placeholder="e.g. Mathematics"
              className="mt-2 w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 outline-none focus:border-violet-400"
            />
          </label>

          <label className="block">
            <span className="text-sm font-medium">Grade</span>
            <input
              type="text"
              name="grade"
              required
              placeholder="e.g. 10th"
              className="mt-2 w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 outline-none focus:border-violet-400"
            />
          </label>

          <label className="block">
            <span className="text-sm font-medium">
              Schedule <span className="text-slate-500">(optional)</span>
            </span>
            <input
              type="text"
              name="schedule"
              placeholder="e.g. Mon/Wed/Fri 4:00 PM"
              className="mt-2 w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 outline-none focus:border-violet-400"
            />
          </label>

          <button
            type="submit"
            className="w-full rounded-lg bg-violet-500 px-5 py-3 font-semibold hover:bg-violet-400"
          >
            Create batch
          </button>
        </form>
      </section>
    </main>
  );
}