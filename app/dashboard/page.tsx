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

function todayLabel() {
  const now = new Date();
  return now.toLocaleDateString("en-IN", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
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
  let todayPresentCount = 0;
  let todayTotalCount = 0;
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
        todayPresentCount = presentCount;
        todayTotalCount = activeEnrollments.length;
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
  const hasMarkedToday = todayTotalCount > 0;

  return (
    <div className="min-h-screen bg-slate-950 text-foreground">
      <NavBar email={user.email || ""} />

      <main className="px-6 py-12">
        <section className="mx-auto max-w-4xl">
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-slate-500">
            {todayLabel()}
          </p>

          {/* Hero: today's attendance as the dominant figure */}
          <div className="mt-4 flex flex-col items-start gap-2 sm:flex-row sm:items-baseline sm:gap-6">
            <h1 className="font-display text-7xl font-semibold leading-none text-foreground sm:text-8xl">
              {hasMarkedToday ? todayAttendanceLabel : "—"}
            </h1>
            <div>
              <p className="text-lg text-slate-300">attendance marked today</p>
              {hasMarkedToday ? (
                <p className="mt-1 font-mono text-sm text-slate-500">
                  {todayPresentCount} of {todayTotalCount} students present
                </p>
              ) : (
                <p className="mt-1 text-sm text-slate-500">
                  {hasBatches
                    ? "No attendance marked yet today."
                    : "Create a batch to start tracking attendance."}
                </p>
              )}
            </div>
          </div>

          {/* Ledger rule */}
          <div className="mt-8 h-px bg-gradient-to-r from-slate-700 via-slate-800 to-transparent" />

          {/* Secondary stats, inline not boxed */}
          <div className="mt-6 flex flex-wrap items-center gap-x-10 gap-y-4">
            <div>
              <p className="font-mono text-2xl font-semibold text-foreground">
                {activeStudentCount}
              </p>
              <p className="text-sm text-slate-500">active students</p>
            </div>
            <div className="h-10 w-px bg-slate-800" />
            <div>
              <p className="font-mono text-2xl font-semibold text-foreground">
                {batchIds.length}
              </p>
              <p className="text-sm text-slate-500">batches</p>
            </div>
          </div>

          {/* Needs attention: a strip, not a fourth card */}
          <Link
            href="/needs-attention"
            className={`mt-8 flex items-center justify-between rounded-lg border px-5 py-4 transition ${
              needsAttentionCount > 0
                ? "border-red-800/60 bg-red-950/20 hover:border-red-600"
                : "border-slate-800 bg-slate-900/40 hover:border-slate-700"
            }`}
          >
            <div className="flex items-center gap-3">
              <span
                className={`h-2 w-2 rounded-full ${
                  needsAttentionCount > 0 ? "bg-red-400" : "bg-emerald-400"
                }`}
              />
              <span className="text-sm font-medium">
                {needsAttentionCount > 0
                  ? `${needsAttentionCount} student${
                      needsAttentionCount === 1 ? "" : "s"
                    } need attention`
                  : "Everyone is on track"}
              </span>
              <span className="text-xs text-slate-500">
                below 75% attendance, last 14 days
              </span>
            </div>
            <span className="text-sm text-slate-400">View →</span>
          </Link>

          {/* Batches panel */}
          {hasBatches ? (
            <section className="mt-10 flex flex-wrap items-center justify-between gap-4 rounded-xl border border-slate-800 bg-gradient-to-br from-slate-900 to-slate-900/60 p-6 shadow-[0_20px_60px_-25px_rgba(0,0,0,0.6)]">
              <div>
                <h2 className="font-display text-xl font-semibold">
                  Your batches
                </h2>
                <p className="mt-1 text-slate-400">
                  Manage classes, students, and attendance.
                </p>
              </div>
              <Link
                href="/batches"
                className="rounded-lg bg-violet-500 px-5 py-2.5 font-semibold text-slate-950 hover:bg-violet-400"
              >
                View batches →
              </Link>
            </section>
          ) : (
            <section className="mt-10 rounded-xl border border-dashed border-slate-700 bg-slate-900/30 p-8">
              <h2 className="font-display text-xl font-semibold">
                Your workspace is ready
              </h2>
              <p className="mt-2 text-slate-400">
                Create your first batch to start tracking real academic data.
              </p>
              <Link
                href="/batches/new"
                className="mt-5 inline-block rounded-lg bg-violet-500 px-5 py-2.5 font-semibold text-slate-950 hover:bg-violet-400"
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