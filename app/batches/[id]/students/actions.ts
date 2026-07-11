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

  return supabase;
}

export async function enrollExistingStudent(
  batchId: string,
  formData: FormData
) {
  const studentId = String(formData.get("studentId") || "");

  if (!studentId) {
    redirect(
      `/batches/${batchId}/students/new?error=` +
        encodeURIComponent("Please select a student.")
    );
  }

  const supabase = await assertOwnsBatch(batchId);

  const { data: existing } = await supabase
    .from("enrollments")
    .select("id")
    .eq("batch_id", batchId)
    .eq("student_id", studentId)
    .maybeSingle();

  if (existing) {
    redirect(
      `/batches/${batchId}/students/new?error=` +
        encodeURIComponent("This student is already enrolled in this batch.")
    );
  }

  const { error } = await supabase.from("enrollments").insert({
    batch_id: batchId,
    student_id: studentId,
    status: "active",
  });

  if (error) {
    console.error("Enroll student error:", error.message);
    redirect(
      `/batches/${batchId}/students/new?error=` +
        encodeURIComponent("Could not enroll student. Please try again.")
    );
  }

  revalidatePath(`/batches/${batchId}`);
  redirect(`/batches/${batchId}`);
}

export async function createAndEnrollStudent(
  batchId: string,
  formData: FormData
) {
  const fullName = String(formData.get("full_name") || "").trim();
  const email = String(formData.get("email") || "").trim();
  const phone = String(formData.get("phone") || "").trim();
  const parentName = String(formData.get("parent_name") || "").trim();
  const parentPhone = String(formData.get("parent_phone") || "").trim();

  if (!fullName) {
    redirect(
      `/batches/${batchId}/students/new?error=` +
        encodeURIComponent("Student name is required.")
    );
  }

  const supabase = await assertOwnsBatch(batchId);

  const { data: student, error: studentError } = await supabase
    .from("students")
    .insert({
      full_name: fullName,
      email: email || null,
      phone: phone || null,
      parent_name: parentName || null,
      parent_phone: parentPhone || null,
      status: "active",
    })
    .select("id")
    .single();

  if (studentError || !student) {
    console.error("Create student error:", studentError?.message);
    redirect(
      `/batches/${batchId}/students/new?error=` +
        encodeURIComponent("Could not create student. Please try again.")
    );
  }

  const { error: enrollError } = await supabase.from("enrollments").insert({
    batch_id: batchId,
    student_id: student!.id,
    status: "active",
  });

  if (enrollError) {
    console.error("Enroll new student error:", enrollError.message);
    redirect(
      `/batches/${batchId}/students/new?error=` +
        encodeURIComponent(
          "Student was created but could not be enrolled. Please try again."
        )
    );
  }

  revalidatePath(`/batches/${batchId}`);
  redirect(`/batches/${batchId}`);
}

export async function removeEnrollment(batchId: string, enrollmentId: string) {
  const supabase = await assertOwnsBatch(batchId);

  const { error } = await supabase
    .from("enrollments")
    .delete()
    .eq("id", enrollmentId)
    .eq("batch_id", batchId);

  if (error) {
    console.error("Remove enrollment error:", error.message);
    redirect(
      `/batches/${batchId}?error=` +
        encodeURIComponent("Could not remove student. Please try again.")
    );
  }

  revalidatePath(`/batches/${batchId}`);
  redirect(`/batches/${batchId}`);
}