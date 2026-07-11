import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { NavBar } from "@/components/NavBar";

function todayISO() {
  const now = new Date();
  const offsetMs = now.getTimezoneOffset() * 60000;
  return new Date(now.getTime() - offsetMs).toISOString().slice(0, 10);
}

function daysAgoISO(days: number) {
  const now = new Date();
  const offsetMs = now.getTimezoneOffset() * 60000;
  const local = new Date(now.getTime() - offsetMs);
  local.setDate(local.getDate() - days);
  return local.toISOString().slice(0, 10);
}

export default async function NeedsAttentionPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: batches } = await supabase
    .from("batches")
    .select("id, name")
    .eq("teacher_id", user!.id);

  const batchIds = (batches || []).map((b) => b.id);
  const batchNameById = new Map((batches || []).map((b) => [b.id, b.name]));

  type FlaggedStudent = {
    studentId: string;
    fullName: string;
    batchId: string;
    batchName: string;
    present: number;
    total: number;
    pct: number;
  };

  let flagged: FlaggedStudent[] = [];
  let loadError = false;

  if (batchIds.length > 0) {
    const { data: enrollments, error: enrollmentsError } = await supabase
      .from("enrollments")
      .select("id, batch_id, students(id, full_name)")
      .in("batch_id", batchIds)
      .eq("status", "active");

    if (enrollmentsError) {
      loadError = true;
    } else if (enrollments && enrollments.length > 0) {
      const enrollmentIds = enrollments.map((e) => e.id);

      const { data: recentRecords, error: recordsError } = await supabase
        .from("attendance_records")
        .select("enrollment_id, status")
        .gte("attendance_date", daysAgoISO(13))
        .lte("attendance_date", todayISO())
        .in("enrollment_id", enrollmentIds);

      if (recordsError) {
        loadError = true;
      } else {
        const byEnrollment = new Map<string, { present: number; total: number }>();

        for (const record of recentRecords || []) {
          const entry = byEnrollment.get(record.enrollment_id) || {
            present: 0,
            total: 0,
          };
          entry.total += 1;
          if (record.status === "present") entry.present += 1;
          byEnrollment.set(record.enrollment_id, entry);
        }

        flagged = enrollments
          .map((enrollment) => {
            const stats = byEnrollment.get(enrollment.id);
            if (!stats || stats.total < 2) return null;
            const pct = stats.present / stats.total;
            if (pct >= 0.75) return null;

            const student = Array.isArray(enrollment.students)
              ? enrollment.students[0]
              : enrollment.students;

            if (!student) return null;

            return {
              studentId: student.id,
              fullName: student.full_name,
              batchId: enrollment.batch_id,
              batchName: batchNameById.get(enrollment.batch_id) || "Unknown batch",
              present: stats.present,
              total: stats.total,
              pct: Math.round(pct * 100),
            };
          })
          .filter((f): f is FlaggedStudent => f !== null)
          .sort((a, b) => a.pct - b.pct);
      }
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <NavBar email={user.email || ""} />

      <main className="px-6 py-10">
        <section className="mx-auto max-w-3xl">
          <Link
            href="/dashboard"
            className="text-sm font-semibold text-violet-300"
          >
            ← Back to dashboard
          </Link>

          <h1 className="mt-6 text-3xl font-bold">Needs attention</h1>
          <p className="mt-2 text-slate-400">
            Students below 75% attendance over the last 14 days (minimum 2
            sessions recorded).
          </p>

          {loadError ? (
            <div className="mt-8 rounded-xl border border-red-900 bg-red-950/30 p-8 text-center">
              <p className="text-red-200">Could not load this data.</p>
              <Link
                href="/needs-attention"
                className="mt-3 inline-block text-sm font-semibold text-violet-300"
              >
                Try again
              </Link>
            </div>
          ) : flagged.length === 0 ? (
            <div className="mt-8 rounded-xl border border-slate-800 bg-slate-900 p-10 text-center">
              <p className="font-semibold">No students need attention</p>
              <p className="mt-2 text-slate-400">
                Everyone is at or above 75% attendance in the last 14 days.
              </p>
            </div>
          ) : (
            <ul className="mt-8 divide-y divide-slate-800 rounded-xl border border-slate-800 bg-slate-900">
              {flagged.map((student) => (
                <li key={`${student.studentId}-${student.batchId}`}>
                  <Link
                    href={`/attendance/${student.batchId}/history`}
                    className="flex items-center justify-between px-5 py-4 hover:bg-slate-800/50"
                  >
                    <div>
                      <p className="font-medium">{student.fullName}</p>
                      <p className="text-sm text-slate-400">
                        {student.batchName}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-red-400">
                        {student.pct}%
                      </p>
                      <p className="text-xs text-slate-500">
                        {student.present}/{student.total} sessions
                      </p>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
      </main>
    </div>
  );
}