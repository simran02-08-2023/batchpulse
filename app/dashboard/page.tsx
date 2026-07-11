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

export default async function DashboardPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: batches } = await supabase
    .from("batches")
    .select("id")
    .eq("teacher_id", user!.id);

  const batchIds = (batches || []).map((b) => b.id);

  let activeStudentCount = 0;
  let todayAttendanceLabel = "—";
  let needsAttentionCount = 0;

  if (batchIds.length > 0) {
    const { data: enrollments } = await supabase
      .from("enrollments")
      .select("id, student_id")
      .in("batch_id", batchIds)
      .eq("status", "active");

    const activeEnrollments = enrollments || [];
    activeStudentCount = new Set(
      activeEnrollments.map((e) => e.student_id)
    ).size;

    if (activeEnrollments.length > 0) {
      const enrollmentIds = activeEnrollments.map((e) => e.id);
      const enrollmentToStudent = new Map(
        activeEnrollments.map((e) => [e.id, e.student_id])
      );

      // Today's attendance %
      const { data: todayRecords } = await supabase
        .from("attendance_records")
        .select("status")
        .eq("attendance_date", todayISO())
        .in("enrollment_id", enrollmentIds);

      if (todayRecords && todayRecords.length > 0) {
        const presentCount = todayRecords.filter(
          (r) => r.status === "present"
        ).length;
        const pct = Math.round(
          (presentCount / activeEnrollments.length) * 100
        );
        todayAttendanceLabel = `${pct}%`;
      } else {
        todayAttendanceLabel = "Not marked";
      }

      // Needs attention: students under 75% attendance in last 14 days,
      // with at least 2 sessions recorded (avoids flagging on 1 absence).
      const { data: recentRecords } = await supabase
        .from("attendance_records")
        .select("enrollment_id, status")
        .gte("attendance_date", daysAgoISO(13))
        .lte("attendance_date", todayISO())
        .in("enrollment_id", enrollmentIds);

      const byStudent = new Map<string, { present: number; total: number }>();

      for (const record of recentRecords || []) {
        const studentId = enrollmentToStudent.get(record.enrollment_id);
        if (!studentId) continue;
        const entry = byStudent.get(studentId) || { present: 0, total: 0 };
        entry.total += 1;
        if (record.status === "present") entry.present += 1;
        byStudent.set(studentId, entry);
      }

      needsAttentionCount = Array.from(byStudent.values()).filter(
        (entry) => entry.total >= 2 && entry.present / entry.total < 0.75
      ).length;
    }
  }

  const hasBatches = batchIds.length > 0;

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <NavBar email={user.email || ""} />

      <main className="px-6 py-10">
        <section className="mx-auto max-w-6xl">
          <div>
            <h1 className="text-3xl font-bold">Dashboard</h1>
            <p className="mt-2 text-slate-400">Signed in as {user.email}</p>
          </div>

          <section className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {[
              ["Active students", String(activeStudentCount)],
              ["Batches", String(batchIds.length)],
              ["Today's attendance", todayAttendanceLabel],
              ["Needs attention", String(needsAttentionCount)],
            ].map(([label, value]) => {
              const isAttentionCard = label === "Needs attention";
              const content = (
                <>
                  <p className="text-sm text-slate-400">{label}</p>
                  <p className="mt-3 text-3xl font-bold">{value}</p>
                  {isAttentionCard ? (
                    <p className="mt-1 text-xs text-slate-500">
                      Below 75% attendance, last 14 days
                    </p>
                  ) : null}
                </>
              );

              return isAttentionCard ? (
                <Link
                  key={label}
                  href="/needs-attention"
                  className="rounded-xl border border-slate-800 bg-slate-900 p-5 transition hover:border-violet-500"
                >
                  {content}
                </Link>
              ) : (
                <article
                  key={label}
                  className="rounded-xl border border-slate-800 bg-slate-900 p-5"
                >
                  {content}
                </article>
              );
            })}
          </section>

          {hasBatches ? (
            <section className="mt-8 flex flex-wrap items-center justify-between gap-4 rounded-xl border border-slate-800 bg-slate-900 p-6">
              <div>
                <h2 className="text-lg font-semibold">Your batches</h2>
                <p className="mt-1 text-slate-400">
                  Manage classes, students, and attendance.
                </p>
              </div>
              <Link
                href="/batches"
                className="rounded-lg bg-violet-500 px-5 py-2.5 font-semibold hover:bg-violet-400"
              >
                View batches →
              </Link>
            </section>
          ) : (
            <section className="mt-8 rounded-xl border border-dashed border-slate-700 bg-slate-900/50 p-8">
              <h2 className="text-xl font-semibold">Your workspace is ready</h2>
              <p className="mt-2 text-slate-400">
                Create your first batch to start tracking real academic
                data.
              </p>
              <Link
                href="/batches/new"
                className="mt-5 inline-block rounded-lg bg-violet-500 px-5 py-2.5 font-semibold hover:bg-violet-400"
              >
                + Create your first batch
              </Link>
            </section>
          )}
        </section>
      </main>
    </div>
  );
}