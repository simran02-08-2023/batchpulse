import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
  enrollExistingStudent,
  createAndEnrollStudent,
} from "@/app/batches/[id]/students/actions";

export default async function AddStudentPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string; q?: string }>;
}) {
  const { id } = await params;
  const { error, q } = await searchParams;
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

  const { data: alreadyEnrolled } = await supabase
    .from("enrollments")
    .select("student_id")
    .eq("batch_id", id);

  const enrolledIds = new Set(
    (alreadyEnrolled || []).map((e) => e.student_id)
  );

  let searchResults: { id: string; full_name: string; email: string | null }[] =
    [];

  if (q && q.trim().length > 0) {
    const { data } = await supabase
      .from("students")
      .select("id, full_name, email")
      .or(`full_name.ilike.%${q}%,email.ilike.%${q}%`)
      .limit(10);

    searchResults = (data || []).filter((s) => !enrolledIds.has(s.id));
  }

  const enrollExistingWithId = enrollExistingStudent.bind(null, id);
  const createAndEnrollWithId = createAndEnrollStudent.bind(null, id);

  return (
    <main className="min-h-screen bg-slate-950 px-6 py-12 text-white">
      <section className="mx-auto w-full max-w-2xl">
        <Link
          href={`/batches/${id}`}
          className="text-sm font-semibold text-violet-300"
        >
          ← Back to {batch.name}
        </Link>

        <h1 className="mt-6 text-3xl font-bold">Add a student</h1>
        <p className="mt-2 text-slate-400">
          Search for an existing student or add a new one.
        </p>

        {error ? (
          <p className="mt-5 rounded-lg border border-red-900 bg-red-950/50 p-3 text-sm text-red-200">
            {error}
          </p>
        ) : null}

        <div className="mt-8 rounded-xl border border-slate-800 bg-slate-900 p-6">
          <h2 className="font-semibold">Search existing students</h2>
          <form
            className="mt-4 flex gap-3"
            action={`/batches/${id}/students/new`}
            method="get"
          >
            <input
              type="text"
              name="q"
              defaultValue={q || ""}
              placeholder="Search by name or email…"
              className="flex-1 rounded-lg border border-slate-700 bg-slate-950 px-4 py-2.5 outline-none focus:border-violet-400"
            />
            <button
              type="submit"
              className="rounded-lg border border-slate-700 px-4 py-2.5 text-sm font-semibold hover:border-violet-400"
            >
              Search
            </button>
          </form>

          {q ? (
            searchResults.length === 0 ? (
              <p className="mt-4 text-sm text-slate-500">
                No matching students found. Add a new one below.
              </p>
            ) : (
              <ul className="mt-4 divide-y divide-slate-800">
                {searchResults.map((student) => (
                  <li
                    key={student.id}
                    className="flex items-center justify-between py-3"
                  >
                    <div>
                      <p className="font-medium">{student.full_name}</p>
                      {student.email ? (
                        <p className="text-sm text-slate-400">
                          {student.email}
                        </p>
                      ) : null}
                    </div>
                    <form action={enrollExistingWithId}>
                      <input
                        type="hidden"
                        name="studentId"
                        value={student.id}
                      />
                      <button
                        type="submit"
                        className="rounded-lg bg-violet-500 px-4 py-2 text-sm font-semibold hover:bg-violet-400"
                      >
                        Enroll
                      </button>
                    </form>
                  </li>
                ))}
              </ul>
            )
          ) : null}
        </div>

        <div className="mt-6 rounded-xl border border-slate-800 bg-slate-900 p-6">
          <h2 className="font-semibold">Or add a new student</h2>
          <form action={createAndEnrollWithId} className="mt-4 space-y-4">
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
                  Parent name{" "}
                  <span className="text-slate-500">(optional)</span>
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
        </div>
      </section>
    </main>
  );
}