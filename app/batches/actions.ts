"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function createBatch(formData: FormData) {
  const name = String(formData.get("name") || "").trim();
  const subject = String(formData.get("subject") || "").trim();
  const grade = String(formData.get("grade") || "").trim();
  const schedule = String(formData.get("schedule") || "").trim();

  if (!name || !subject || !grade) {
    redirect(
      "/batches/new?error=" +
        encodeURIComponent("Name, subject, and grade are required.")
    );
  }

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data, error } = await supabase
    .from("batches")
    .insert({
      name,
      subject,
      grade,
      schedule: schedule || null,
      teacher_id: user!.id,
    })
    .select("id")
    .single();

  if (error) {
    console.error("Create batch error:", error.message);
    redirect(
      "/batches/new?error=" +
        encodeURIComponent("Could not create batch. Please try again.")
    );
  }

  revalidatePath("/batches");
  redirect(`/batches/${data.id}`);
}

export async function deleteBatch(batchId: string) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { error } = await supabase
    .from("batches")
    .delete()
    .eq("id", batchId)
    .eq("teacher_id", user!.id);

  if (error) {
    console.error("Delete batch error:", error.message);
    redirect(
      `/batches/${batchId}?error=` +
        encodeURIComponent("Could not delete batch. Please try again.")
    );
  }

  revalidatePath("/batches");
  redirect("/batches");
}

export async function updateBatch(batchId: string, formData: FormData) {
  const name = String(formData.get("name") || "").trim();
  const subject = String(formData.get("subject") || "").trim();
  const grade = String(formData.get("grade") || "").trim();
  const schedule = String(formData.get("schedule") || "").trim();

  if (!name || !subject || !grade) {
    redirect(
      `/batches/${batchId}/edit?error=` +
        encodeURIComponent("Name, subject, and grade are required.")
    );
  }

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { error } = await supabase
    .from("batches")
    .update({
      name,
      subject,
      grade,
      schedule: schedule || null,
    })
    .eq("id", batchId)
    .eq("teacher_id", user!.id);

  if (error) {
    console.error("Update batch error:", error.message);
    redirect(
      `/batches/${batchId}/edit?error=` +
        encodeURIComponent("Could not update batch. Please try again.")
    );
  }

  revalidatePath("/batches");
  revalidatePath(`/batches/${batchId}`);
  redirect(`/batches/${batchId}`);
}