import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { deleteBatch } from "@/app/batches/actions";
import type { EnrollmentWithStudent } from "@/lib/types";

export default async function BatchDetailPage({
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

  const { data: batch, error: batchError } = await supabase
    .from("batches")
    .select("*")
    .eq("id", id)
    .eq("teacher_id", user!.id)
    .single();

  if (batchError || !batch) {
    notFound();
  }

  const { data: enrollments, error: enrollmentsError } = await supabase
    .from("enrollments")
    .select("*, students(*)")
    .eq("batch_id", id)
    .order("joined_at", { ascending: false });

  const deleteBatchWithId = deleteBatch.bind(null, id);

  return (
    <main className="min-h-screen bg-slate-950 px-6 py-12 text-white">
      <section className="mx-auto w-full max-w-4xl">
        <Link href="/batches" className="text-sm font-semibold text-violet-300">
          ← Back to batches
        </Link>

        {errorParam ? (
          <p className="mt-5 rounded-lg border border-red-900 bg-red-950/50 p-3 text-sm text-red-200">
            {errorParam}
          </p>
        ) : null}

        <div className="mt-6 flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold">{batch.name}</h1>
            <p className="mt-1 text-slate-400">
              {batch.subject} · Grade {batch.grade}
            </p>
            {batch.schedule ? (
              <p className="mt-1 text-sm text-slate-500">{batch.schedule}</p>
            ) : null}
          </div>

          <div className="flex gap-3">
            <Link
              href={`/batches/${id}/materials`}
              className="rounded-lg border border-slate-700 px-4 py-2 text-sm font-semibold hover:border-violet-400"
            >
              Materials
            </Link>
            <Link
              href={`/batches/${id}/edit`}
              className="rounded-lg border border-slate-700 px-4 py-2 text-sm font-semibold hover:border-violet-400"
            >
              Edit
            </Link>
            <form action={deleteBatchWithId}>
              <button
                type="submit"
                className="rounded-lg border border-red-900 px-4 py-2 text-sm font-semibold text-red-300 hover:bg-red-950/50"
              >
                Delete
              </button>
            </form>
          </div>
        </div>

        <div className="mt-10 flex items-center justify-between">
          <h2 className="text-xl font-semibold">Students</h2>
          <Link
            href={`/batches/${id}/students/new`}
            className="rounded-lg bg-violet-500 px-4 py-2 text-sm font-semibold hover:bg-violet-400"
          >
            + Add student
          </Link>
        </div>

        {enrollmentsError ? (
          <div className="mt-4 rounded-xl border border-red-900 bg-red-950/30 p-8 text-center">
            <p className="text-red-200">Could not load students.</p>
            <Link
              href={`/batches/${id}`}
              className="mt-3 inline-block text-sm font-semibold text-violet-300"
            >
              Try again
            </Link>
          </div>
        ) : !enrollments || enrollments.length === 0 ? (
          <div className="mt-4 rounded-xl border border-slate-800 bg-slate-900 p-10 text-center">
            <p className="font-semibold">No students enrolled yet</p>
            <p className="mt-2 text-slate-400">
              Add your first student to this batch.
            </p>
            <Link
              href={`/batches/${id}/students/new`}
              className="mt-5 inline-block rounded-lg bg-violet-500 px-5 py-2.5 font-semibold hover:bg-violet-400"
            >
              + Add student
            </Link>
          </div>
        ) : (
          <ul className="mt-4 divide-y divide-slate-800 rounded-xl border border-slate-800 bg-slate-900">
            {(enrollments as EnrollmentWithStudent[]).map((enrollment) => (
              <li
                key={enrollment.id}
                className="flex items-center justify-between px-5 py-4"
              >
                <div>
                  <p className="font-medium">{enrollment.students.full_name}</p>
                  <p className="text-sm text-slate-400">
                    {enrollment.students.email || "No email"}
                  </p>
                </div>
                <span
                  className={`rounded-full px-3 py-1 text-xs font-semibold ${
                    enrollment.status === "active"
                      ? "bg-emerald-950 text-emerald-300"
                      : "bg-slate-800 text-slate-400"
                  }`}
                >
                  {enrollment.status}
                </span>
              </li>
            ))}
          </ul>
        )}

        {enrollments && enrollments.length > 0 ? (
          <div className="mt-6">
            <Link
              href={`/attendance/${id}`}
              className="rounded-lg bg-violet-500 px-5 py-2.5 font-semibold hover:bg-violet-400"
            >
              Mark attendance →
            </Link>
          </div>
        ) : null}
      </section>
    </main>
  );
}