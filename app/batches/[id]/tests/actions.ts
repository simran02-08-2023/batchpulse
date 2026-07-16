"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

async function assertOwnsBatch(batchId: string) {
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

  return { supabase, userId: user!.id };
}

export async function createTest(batchId: string, formData: FormData) {
  const title = String(formData.get("title") || "").trim();
  const maxMarks = Number(formData.get("max_marks") || 0);
  const testDate = String(formData.get("test_date") || "").trim();

  if (!title) {
    redirect(
      `/batches/${batchId}/tests/new?error=` +
        encodeURIComponent("Title is required.")
    );
  }

  if (!maxMarks || maxMarks <= 0) {
    redirect(
      `/batches/${batchId}/tests/new?error=` +
        encodeURIComponent("Max marks must be a positive number.")
    );
  }

  if (!testDate) {
    redirect(
      `/batches/${batchId}/tests/new?error=` +
        encodeURIComponent("Test date is required.")
    );
  }

  const { supabase, userId } = await assertOwnsBatch(batchId);

  const { data: test, error } = await supabase
    .from("tests")
    .insert({
      batch_id: batchId,
      title,
      max_marks: maxMarks,
      test_date: testDate,
      created_by: userId,
    })
    .select("id")
    .single();

  if (error || !test) {
    console.error("Create test error:", error?.message);
    redirect(
      `/batches/${batchId}/tests/new?error=` +
        encodeURIComponent("Could not create test. Please try again.")
    );
  }

  revalidatePath(`/batches/${batchId}/tests`);
  redirect(`/batches/${batchId}/tests/${test!.id}`);
}

export async function deleteTest(batchId: string, testId: string) {
  const { supabase } = await assertOwnsBatch(batchId);

  const { error } = await supabase
    .from("tests")
    .delete()
    .eq("id", testId)
    .eq("batch_id", batchId);

  if (error) {
    console.error("Delete test error:", error.message);
    redirect(
      `/batches/${batchId}/tests?error=` +
        encodeURIComponent("Could not delete test. Please try again.")
    );
  }

  revalidatePath(`/batches/${batchId}/tests`);
  redirect(`/batches/${batchId}/tests`);
}

export async function saveMarks(
  batchId: string,
  testId: string,
  maxMarks: number,
  formData: FormData
) {
  const { supabase } = await assertOwnsBatch(batchId);

  const { data: enrollments } = await supabase
    .from("enrollments")
    .select("student_id")
    .eq("batch_id", batchId)
    .eq("status", "active");

  if (!enrollments || enrollments.length === 0) {
    redirect(
      `/batches/${batchId}/tests/${testId}?error=` +
        encodeURIComponent("No active students in this batch.")
    );
  }

  const studentIds = new Set(enrollments!.map((e) => e.student_id));

  const records = Array.from(studentIds)
    .map((studentId) => {
      const rawMarks = formData.get(`marks_${studentId}`);
      const note = formData.get(`note_${studentId}`);

      if (rawMarks === null || String(rawMarks).trim() === "") return null;

      const marks = Number(rawMarks);

      if (Number.isNaN(marks) || marks < 0 || marks > maxMarks) {
        return null;
      }

      return {
        test_id: testId,
        student_id: studentId,
        marks,
        teacher_note: note ? String(note).trim() || null : null,
      };
    })
    .filter((r): r is NonNullable<typeof r> => r !== null);

  if (records.length === 0) {
    redirect(
      `/batches/${batchId}/tests/${testId}?error=` +
        encodeURIComponent(
          "No valid marks submitted. Marks must be between 0 and max marks."
        )
    );
  }

  const { error } = await supabase
    .from("test_results")
    .upsert(records, { onConflict: "student_id,test_id" });

  if (error) {
    console.error("Save marks error:", error.message);
    redirect(
      `/batches/${batchId}/tests/${testId}?error=` +
        encodeURIComponent("Could not save marks. Please try again.")
    );
  }

  revalidatePath(`/batches/${batchId}/tests/${testId}`);
  revalidatePath(`/batches/${batchId}/tests`);
  redirect(`/batches/${batchId}/tests/${testId}?saved=1`);
}