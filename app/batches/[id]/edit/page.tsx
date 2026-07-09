import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { updateBatch } from "@/app/batches/actions";

export default async function EditBatchPage({
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

  const { data: batch, error: batchError } = await supabase
    .from("batches")
    .select("*")
    .eq("id", id)
    .eq("teacher_id", user!.id)
    .single();

  if (batchError || !batch) {
    notFound();
  }

  const updateBatchWithId = updateBatch.bind(null, id);

  return (
    <main className="min-h-screen bg-slate-950 px-6 py-16 text-white">
      <section className="mx-auto w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900 p-8">
        <Link
          href={`/batches/${id}`}
          className="text-sm font-semibold text-violet-300"
        >
          ← Back to batch
        </Link>

        <h1 className="mt-8 text-3xl font-bold">Edit batch</h1>

        {error ? (
          <p className="mt-5 rounded-lg border border-red-900 bg-red-950/50 p-3 text-sm text-red-200">
            {error}
          </p>
        ) : null}

        <form action={updateBatchWithId} className="mt-8 space-y-5">
          <label className="block">
            <span className="text-sm font-medium">Batch name</span>
            <input
              type="text"
              name="name"
              required
              defaultValue={batch.name}
              className="mt-2 w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 outline-none focus:border-violet-400"
            />
          </label>

          <label className="block">
            <span className="text-sm font-medium">Subject</span>
            <input
              type="text"
              name="subject"
              required
              defaultValue={batch.subject}
              className="mt-2 w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 outline-none focus:border-violet-400"
            />
          </label>

          <label className="block">
            <span className="text-sm font-medium">Grade</span>
            <input
              type="text"
              name="grade"
              required
              defaultValue={batch.grade}
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
              defaultValue={batch.schedule || ""}
              className="mt-2 w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 outline-none focus:border-violet-400"
            />
          </label>

          <button
            type="submit"
            className="w-full rounded-lg bg-violet-500 px-5 py-3 font-semibold hover:bg-violet-400"
          >
            Save changes
          </button>
        </form>
      </section>
    </main>
  );
}