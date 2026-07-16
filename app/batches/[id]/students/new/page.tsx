import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAndEnrollStudent } from "@/app/batches/[id]/students/actions";

export default async function NewStudentPage({
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

  const createAndEnrollWithId = createAndEnrollStudent.bind(null, id);

  return (
    <main className="min-h-screen bg-slate-950 px-6 py-16 text-white">
      <section className="mx-auto w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900 p-8">
        <Link
          href={`/batches/${id}`}
          className="text-sm font-semibold text-violet-300"
        >
          ← Back to {batch.name}
        </Link>

        <h1 className="mt-8 text-3xl font-bold">Add a new student</h1>
        <p className="mt-2 text-slate-400">
          Looking for an existing student instead?{" "}
          <Link
            href={`/batches/${id}`}
            className="font-semibold text-violet-300"
          >
            Search from the batch page
          </Link>
          .
        </p>

        {error ? (
          <p className="mt-5 rounded-lg border border-red-900 bg-red-950/50 p-3 text-sm text-red-200">
            {error}
          </p>
        ) : null}

        <form action={createAndEnrollWithId} className="mt-8 space-y-5">
          <label className="block">
            <span className="text-sm font-medium">Full name</span>
            <input
              type="text"
              name="full_name"
              required
              placeholder="e.g. Riya Sharma"
              className="mt-2 w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-2.5 outline-none focus:border-violet-400"
            />
          </label>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block">
              <span className="text-sm font-medium">
                Email <span className="text-slate-500">(optional)</span>
              </span>
              <input
                type="email"
                name="email"
                placeholder="student@example.com"
                className="mt-2 w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-2.5 outline-none focus:border-violet-400"
              />
            </label>

            <label className="block">
              <span className="text-sm font-medium">
                Phone <span className="text-slate-500">(optional)</span>
              </span>
              <input
                type="tel"
                name="phone"
                placeholder="+91…"
                className="mt-2 w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-2.5 outline-none focus:border-violet-400"
              />
            </label>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block">
              <span className="text-sm font-medium">
                Parent name <span className="text-slate-500">(optional)</span>
              </span>
              <input
                type="text"
                name="parent_name"
                className="mt-2 w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-2.5 outline-none focus:border-violet-400"
              />
            </label>

            <label className="block">
              <span className="text-sm font-medium">
                Parent phone{" "}
                <span className="text-slate-500">(optional)</span>
              </span>
              <input
                type="tel"
                name="parent_phone"
                className="mt-2 w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-2.5 outline-none focus:border-violet-400"
              />
            </label>
          </div>

          <button
            type="submit"
            className="w-full rounded-lg bg-violet-500 px-5 py-3 font-semibold hover:bg-violet-400"
          >
            Create and enroll
          </button>
        </form>
      </section>
    </main>
  );
}