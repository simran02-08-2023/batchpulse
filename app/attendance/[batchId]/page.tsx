import { AttendanceDatePicker } from "@/components/AttendanceDatePicker";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { saveAttendance } from "@/app/attendance/[batchId]/actions";

function todayISO() {
  const now = new Date();
  const offsetMs = now.getTimezoneOffset() * 60000;
  return new Date(now.getTime() - offsetMs).toISOString().slice(0, 10);
}

export default async function AttendancePage({
  params,
  searchParams,
}: {
  params: Promise<{ batchId: string }>;
  searchParams: Promise<{ date?: string; error?: string; saved?: string }>;
}) {
  const { batchId } = await params;
  const { date, error, saved } = await searchParams;
  const attendanceDate = date || todayISO();

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

  const { data: enrollments, error: enrollmentsError } = await supabase
    .from("enrollments")
    .select("id, students(id, full_name)")
    .eq("batch_id", batchId)
    .eq("status", "active")
    .order("id");

  const enrollmentIds = (enrollments || []).map((e) => e.id);

  let existingByEnrollment = new Map<string, string>();

  if (enrollmentIds.length > 0) {
    const { data: existingRecords } = await supabase
      .from("attendance_records")
      .select("enrollment_id, status")
      .eq("attendance_date", attendanceDate)
      .in("enrollment_id", enrollmentIds);

    existingByEnrollment = new Map(
      (existingRecords || []).map((r) => [r.enrollment_id, r.status])
    );
  }

  const saveAttendanceWithId = saveAttendance.bind(null, batchId);

  return (
    <main className="min-h-screen bg-slate-950 px-6 py-12 text-white">
      <section className="mx-auto w-full max-w-2xl">
        <Link
          href={`/batches/${batchId}`}
          className="text-sm font-semibold text-violet-300"
        >
          ← Back to {batch.name}
        </Link>

        <div className="mt-6 flex flex-wrap items-center justify-between gap-4">
          <h1 className="text-3xl font-bold">Mark attendance</h1>
          <Link
            href={`/attendance/${batchId}/history`}
            className="text-sm font-semibold text-violet-300"
          >
            View history →
          </Link>
        </div>

        <div className="mt-6">
          <AttendanceDatePicker
            batchId={batchId}
            currentDate={attendanceDate}
            maxDate={todayISO()}
          />
        </div>

        {saved ? (
          <p className="mt-6 rounded-lg border border-emerald-900 bg-emerald-950/50 p-3 text-sm text-emerald-200">
            Attendance saved for {attendanceDate}.
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
            <Link
              href={`/attendance/${batchId}?date=${attendanceDate}`}
              className="mt-3 inline-block text-sm font-semibold text-violet-300"
            >
              Try again
            </Link>
          </div>
        ) : !enrollments || enrollments.length === 0 ? (
          <div className="mt-8 rounded-xl border border-slate-800 bg-slate-900 p-10 text-center">
            <p className="font-semibold">No active students in this batch</p>
            <p className="mt-2 text-slate-400">
              Add students before marking attendance.
            </p>
            <Link
              href={`/batches/${batchId}/students/new`}
              className="mt-5 inline-block rounded-lg bg-violet-500 px-5 py-2.5 font-semibold hover:bg-violet-400"
            >
              + Add student
            </Link>
          </div>
        ) : (
          <form action={saveAttendanceWithId} className="mt-8">
            <input type="hidden" name="attendance_date" value={attendanceDate} />

            <ul className="divide-y divide-slate-800 rounded-xl border border-slate-800 bg-slate-900">
              {enrollments.map((enrollment) => {
                const student = Array.isArray(enrollment.students)
                  ? enrollment.students[0]
                  : enrollment.students;
                const currentStatus =
                  existingByEnrollment.get(enrollment.id) || "present";

                return (
                  <li
                    key={enrollment.id}
                    className="flex items-center justify-between px-5 py-4"
                  >
                    <span className="font-medium">{student?.full_name}</span>

                    <div className="flex overflow-hidden rounded-lg border border-slate-700">
                      <label className="cursor-pointer">
                        <input
                          type="radio"
                          name={`status_${enrollment.id}`}
                          value="present"
                          defaultChecked={currentStatus === "present"}
                          className="peer sr-only"
                        />
                        <span className="block px-4 py-2 text-sm font-semibold text-slate-400 peer-checked:bg-emerald-500 peer-checked:text-white">
                          Present
                        </span>
                      </label>
                      <label className="cursor-pointer">
                        <input
                          type="radio"
                          name={`status_${enrollment.id}`}
                          value="absent"
                          defaultChecked={currentStatus === "absent"}
                          className="peer sr-only"
                        />
                        <span className="block px-4 py-2 text-sm font-semibold text-slate-400 peer-checked:bg-red-500 peer-checked:text-white">
                          Absent
                        </span>
                      </label>
                    </div>
                  </li>
                );
              })}
            </ul>

            <button
              type="submit"
              className="mt-6 w-full rounded-lg bg-violet-500 px-5 py-3 font-semibold hover:bg-violet-400"
            >
              Save attendance
            </button>
          </form>
        )}
      </section>
    </main>
  );
}