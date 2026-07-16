import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { saveMarks, deleteTest } from "@/app/batches/[id]/tests/actions";

export default async function TestMarksPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string; testId: string }>;
  searchParams: Promise<{ error?: string; saved?: string }>;
}) {
  const { id, testId } = await params;
  const { error, saved } = await searchParams;
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

  const { data: test } = await supabase
    .from("tests")
    .select("*")
    .eq("id", testId)
    .eq("batch_id", id)
    .single();

  if (!test) {
    notFound();
  }

  const { data: enrollments, error: enrollmentsError } = await supabase
    .from("enrollments")
    .select("id, students(id, full_name)")
    .eq("batch_id", id)
    .eq("status", "active")
    .order("id");

  const studentIds = (enrollments || [])
    .map((e) => {
      const student = Array.isArray(e.students) ? e.students[0] : e.students;
      return student?.id;
    })
    .filter((sid): sid is string => Boolean(sid));

  let existingByStudent = new Map<string, { marks: number; teacher_note: string | null }>();

  if (studentIds.length > 0) {
    const { data: existingResults } = await supabase
      .from("test_results")
      .select("student_id, marks, teacher_note")
      .eq("test_id", testId)
      .in("student_id", studentIds);

    existingByStudent = new Map(
      (existingResults || []).map((r) => [
        r.student_id,
        { marks: Number(r.marks), teacher_note: r.teacher_note },
      ])
    );
  }

  const saveMarksWithIds = saveMarks.bind(null, id, testId, test.max_marks);
  const deleteTestWithIds = deleteTest.bind(null, id, testId);

  return (
    <main className="min-h-screen bg-slate-950 px-6 py-12 text-white">
      <section className="mx-auto w-full max-w-2xl">
        <Link
          href={`/batches/${id}/tests`}
          className="text-sm font-semibold text-violet-300"
        >
          ← Back to tests
        </Link>

        <div className="mt-6 flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold">{test.title}</h1>
            <p className="mt-1 text-slate-400">
              {new Date(test.test_date + "T00:00:00").toLocaleDateString(
                "en-IN",
                { day: "numeric", month: "short", year: "numeric" }
              )}{" "}
              · Max marks: {test.max_marks}
            </p>
          </div>
          <form action={deleteTestWithIds}>
            <button
              type="submit"
              className="rounded-lg border border-red-900 px-4 py-2 text-sm font-semibold text-red-300 hover:bg-red-950/50"
            >
              Delete test
            </button>
          </form>
        </div>

        {saved ? (
          <p className="mt-6 rounded-lg border border-emerald-900 bg-emerald-950/50 p-3 text-sm text-emerald-200">
            Marks saved successfully.
          </p>
        ) : null}

        {error ? (
          <p className="mt-6 rounded-lg border border-red-900 bg-red-950/50 p-3 text-sm text-red-200">
            {error}
          </p>
        ) : null}

        {enrollmentsError ? (
          <div className="mt-8 rounded-xl border border-red-900 bg-red-950/30 p-8 text-center">
            <p className="text-red-200">Could not load students.</p>
          </div>
        ) : !enrollments || enrollments.length === 0 ? (
          <div className="mt-8 rounded-xl border border-slate-800 bg-slate-900 p-10 text-center">
            <p className="font-semibold">No active students in this batch</p>
            <p className="mt-2 text-slate-400">
              Add students before entering marks.
            </p>
          </div>
        ) : (
          <form action={saveMarksWithIds} className="mt-8">
            <ul className="divide-y divide-slate-800 rounded-xl border border-slate-800 bg-slate-900">
              {enrollments.map((enrollment) => {
                const student = Array.isArray(enrollment.students)
                  ? enrollment.students[0]
                  : enrollment.students;

                if (!student) return null;

                const existing = existingByStudent.get(student.id);

                return (
                  <li
                    key={enrollment.id}
                    className="flex flex-wrap items-center justify-between gap-3 px-5 py-4"
                  >
                    <span className="font-medium">{student.full_name}</span>
                    <div className="flex items-center gap-3">
                      <input
                        type="number"
                        name={`marks_${student.id}`}
                        min={0}
                        max={test.max_marks}
                        step="0.5"
                        defaultValue={existing?.marks ?? ""}
                        placeholder={`/ ${test.max_marks}`}
                        className="w-24 rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-center outline-none focus:border-violet-400"
                      />
                      <input
                        type="text"
                        name={`note_${student.id}`}
                        defaultValue={existing?.teacher_note || ""}
                        placeholder="Note (optional)"
                        className="w-40 rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm outline-none focus:border-violet-400"
                      />
                    </div>
                  </li>
                );
              })}
            </ul>

            <button
              type="submit"
              className="mt-6 w-full rounded-lg bg-violet-500 px-5 py-3 font-semibold hover:bg-violet-400"
            >
              Save marks
            </button>
          </form>
        )}
      </section>
    </main>
  );
}