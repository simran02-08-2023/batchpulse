"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function saveAttendance(batchId: string, formData: FormData) {
  const attendanceDate = String(formData.get("attendance_date") || "");

  if (!attendanceDate) {
    redirect(
      `/attendance/${batchId}?error=` +
        encodeURIComponent("Please select a date.")
    );
  }

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: batch } = await supabase
    .from("batches")
    .select("id")
    .eq("id", batchId)
    .eq("teacher_id", user!.id)
    .single();

  if (!batch) {
    redirect("/batches");
  }

  const { data: enrollments } = await supabase
    .from("enrollments")
    .select("id")
    .eq("batch_id", batchId)
    .eq("status", "active");

  if (!enrollments || enrollments.length === 0) {
    redirect(
      `/attendance/${batchId}?date=${attendanceDate}&error=` +
        encodeURIComponent("No active students to mark attendance for.")
    );
  }

  const enrollmentIds = new Set(enrollments!.map((e) => e.id));

  const records = enrollments!
    .map((enrollment) => {
      const status = formData.get(`status_${enrollment.id}`);
      if (!status || !enrollmentIds.has(enrollment.id)) return null;
      return {
        enrollment_id: enrollment.id,
        attendance_date: attendanceDate,
        status: String(status),
        marked_by: user!.id,
      };
    })
    .filter((r): r is NonNullable<typeof r> => r !== null);

  if (records.length === 0) {
    redirect(
      `/attendance/${batchId}?date=${attendanceDate}&error=` +
        encodeURIComponent("No attendance data submitted.")
    );
  }

  const { error } = await supabase
    .from("attendance_records")
    .upsert(records, { onConflict: "enrollment_id,attendance_date" });

  if (error) {
    console.error("Save attendance error:", error.message);
    redirect(
      `/attendance/${batchId}?date=${attendanceDate}&error=` +
        encodeURIComponent(
          "Could not save attendance. Please try again."
        )
    );
  }

  revalidatePath(`/attendance/${batchId}`);
  revalidatePath(`/attendance/${batchId}/history`);
  redirect(`/attendance/${batchId}?date=${attendanceDate}&saved=1`);
}