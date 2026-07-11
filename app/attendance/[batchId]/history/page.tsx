import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export default async function AttendanceHistoryPage({
  params,
}: {
  params: Promise<{ batchId: string }>;
}) {
  const { batchId } = await params;
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
    .eq("id", batchId)
    .eq("teacher_id", user!.id)
    .single();

  if (!batch) {
    notFound();
  }

  const { data: enrollments } = await supabase
    .from("enrollments")
    .select("id")
    .eq("batch_id", batchId);

  const enrollmentIds = (enrollments || []).map((e) => e.id);

  let dateSummaries: {
    date: string;
    present: number;
    absent: number;
    total: number;
  }[] = [];

  let loadError = false;

  if (enrollmentIds.length > 0) {
    const { data: records, error } = await supabase
      .from("attendance_records")
      .select("attendance_date, status")
      .in("enrollment_id", enrollmentIds)
      .order("attendance_date", { ascending: false });

    if (error) {
      loadError = true;
    } else {
      const byDate = new Map<string, { present: number; absent: number }>();

      for (const record of records || []) {
        const entry = byDate.get(record.attendance_date) || {
          present: 0,
          absent: 0,
        };
        if (record.status === "present") entry.present += 1;
        else if (record.status === "absent") entry.absent += 1;
        byDate.set(record.attendance_date, entry);
      }

      dateSummaries = Array.from(byDate.entries())
        .map(([date, counts]) => ({
          date,
          present: counts.present,
          absent: counts.absent,
          total: counts.present + counts.absent,
        }))
        .sort((a, b) => (a.date < b.date ? 1 : -1));
    }
  }

  return (
    <main className="min-h-screen bg-slate-950 px-6 py-12 text-white">
      <section className="mx-auto w-full max-w-2xl">
        <Link
          href={`/attendance/${batchId}`}
          className="text-sm font-semibold text-violet-300"
        >
          ← Back to mark attendance
        </Link>

        <h1 className="mt-6 text-3xl font-bold">Attendance history</h1>
        <p className="mt-2 text-slate-400">{batch.name}</p>

        {loadError ? (
          <div className="mt-8 rounded-xl border border-red-900 bg-red-950/30 p-8 text-center">
            <p className="text-red-200">Could not load attendance history.</p>
            <Link
              href={`/attendance/${batchId}/history`}
              className="mt-3 inline-block text-sm font-semibold text-violet-300"
            >
              Try again
            </Link>
          </div>
        ) : dateSummaries.length === 0 ? (
          <div className="mt-8 rounded-xl border border-slate-800 bg-slate-900 p-10 text-center">
            <p className="font-semibold">No attendance recorded yet</p>
            <p className="mt-2 text-slate-400">
              Mark attendance for a date to see history here.
            </p>
            <Link
              href={`/attendance/${batchId}`}
              className="mt-5 inline-block rounded-lg bg-violet-500 px-5 py-2.5 font-semibold hover:bg-violet-400"
            >
              Mark attendance
            </Link>
          </div>
        ) : (
          <ul className="mt-8 divide-y divide-slate-800 rounded-xl border border-slate-800 bg-slate-900">
            {dateSummaries.map((summary) => (
              <li key={summary.date}>
                <Link
                  href={`/attendance/${batchId}?date=${summary.date}`}
                  className="flex items-center justify-between px-5 py-4 hover:bg-slate-800/50"
                >
                  <span className="font-medium">
                    {new Date(summary.date + "T00:00:00").toLocaleDateString(
                      "en-IN",
                      { weekday: "short", day: "numeric", month: "short", year: "numeric" }
                    )}
                  </span>
                  <span className="text-sm text-slate-400">
                    <span className="text-emerald-400">
                      {summary.present} present
                    </span>
                    {" · "}
                    <span className="text-red-400">
                      {summary.absent} absent
                    </span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}