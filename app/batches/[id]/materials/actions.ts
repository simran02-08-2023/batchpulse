"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

const MAX_FILE_BYTES = 10 * 1024 * 1024; // 10MB
const ALLOWED_TYPES = new Set([
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/webp",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
]);

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

export async function uploadMaterial(batchId: string, formData: FormData) {
  const chapter = String(formData.get("chapter") || "").trim();
  const title = String(formData.get("title") || "").trim();
  const description = String(formData.get("description") || "").trim();
  const file = formData.get("file") as File | null;

  if (!chapter || !title) {
    redirect(
      `/batches/${batchId}/materials/new?error=` +
        encodeURIComponent("Chapter and title are required.")
    );
  }

  if (!file || file.size === 0) {
    redirect(
      `/batches/${batchId}/materials/new?error=` +
        encodeURIComponent("Please select a file to upload.")
    );
  }

  if (file!.size > MAX_FILE_BYTES) {
    redirect(
      `/batches/${batchId}/materials/new?error=` +
        encodeURIComponent("File is too large. Max size is 10MB.")
    );
  }

  if (!ALLOWED_TYPES.has(file!.type)) {
    redirect(
      `/batches/${batchId}/materials/new?error=` +
        encodeURIComponent(
          "Unsupported file type. Use PDF, JPG, PNG, WEBP, or DOCX."
        )
    );
  }

  const { supabase, userId } = await assertOwnsBatch(batchId);

  const safeName = file!.name.replace(/[^a-zA-Z0-9._-]/g, "_");
  const path = `${batchId}/${Date.now()}-${safeName}`;

  const { error: uploadError } = await supabase.storage
    .from("materials")
    .upload(path, file!, {
      contentType: file!.type,
      upsert: false,
    });

  if (uploadError) {
    console.error("Upload material file error:", uploadError.message);
    redirect(
      `/batches/${batchId}/materials/new?error=` +
        encodeURIComponent("Could not upload file. Please try again.")
    );
  }

  const { error: dbError } = await supabase.from("materials").insert({
    batch_id: batchId,
    chapter,
    title,
    description: description || null,
    file_path: path,
    file_type: file!.type,
    uploaded_by: userId,
  });

  if (dbError) {
    console.error("Save material record error:", dbError.message);
    await supabase.storage.from("materials").remove([path]);
    redirect(
      `/batches/${batchId}/materials/new?error=` +
        encodeURIComponent("Could not save material. Please try again.")
    );
  }

  revalidatePath(`/batches/${batchId}/materials`);
  redirect(`/batches/${batchId}/materials`);
}

export async function deleteMaterial(
  batchId: string,
  materialId: string,
  filePath: string
) {
  const { supabase } = await assertOwnsBatch(batchId);

  const { error: storageError } = await supabase.storage
    .from("materials")
    .remove([filePath]);

  if (storageError) {
    console.error("Delete material file error:", storageError.message);
  }

  const { error: dbError } = await supabase
    .from("materials")
    .delete()
    .eq("id", materialId)
    .eq("batch_id", batchId);

  if (dbError) {
    console.error("Delete material record error:", dbError.message);
    redirect(
      `/batches/${batchId}/materials?error=` +
        encodeURIComponent("Could not delete material. Please try again.")
    );
  }

  revalidatePath(`/batches/${batchId}/materials`);
  redirect(`/batches/${batchId}/materials`);
}