import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { uploadMaterial } from "@/app/batches/[id]/materials/actions";

export default async function NewMaterialPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const { id } = await params;
  const { error } = await searchParams;
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
    .eq("id", id)
    .eq("teacher_id", user!.id)
    .single();

  if (!batch) {
    notFound();
  }

  const uploadMaterialWithId = uploadMaterial.bind(null, id);

  return (
    <main className="min-h-screen bg-slate-950 px-6 py-16 text-white">
      <section className="mx-auto w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900 p-8">
        <Link
          href={`/batches/${id}/materials`}
          className="text-sm font-semibold text-violet-300"
        >
          ← Back to materials
        </Link>

        <h1 className="mt-8 text-3xl font-bold">Upload material</h1>
        <p className="mt-2 text-slate-400">
          Add notes for {batch.name}, organized by chapter.
        </p>

        {error ? (
          <p className="mt-5 rounded-lg border border-red-900 bg-red-950/50 p-3 text-sm text-red-200">
            {error}
          </p>
        ) : null}

        <form
          action={uploadMaterialWithId}
          className="mt-8 space-y-5"
          encType="multipart/form-data"
        >
          <label className="block">
            <span className="text-sm font-medium">Chapter</span>
            <input
              type="text"
              name="chapter"
              required
              placeholder="e.g. Chapter 3: Trigonometry"
              className="mt-2 w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 outline-none focus:border-violet-400"
            />
          </label>

          <label className="block">
            <span className="text-sm font-medium">Title</span>
            <input
              type="text"
              name="title"
              required
              placeholder="e.g. Trig Identities Cheat Sheet"
              className="mt-2 w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 outline-none focus:border-violet-400"
            />
          </label>

          <label className="block">
            <span className="text-sm font-medium">
              Description <span className="text-slate-500">(optional)</span>
            </span>
            <textarea
              name="description"
              rows={3}
              placeholder="Notes about what this covers…"
              className="mt-2 w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 outline-none focus:border-violet-400"
            />
          </label>

          <label className="block">
            <span className="text-sm font-medium">File</span>
            <input
              type="file"
              name="file"
              required
              accept=".pdf,.jpg,.jpeg,.png,.webp,.docx"
              className="mt-2 w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 text-sm outline-none file:mr-4 file:rounded-md file:border-0 file:bg-violet-500 file:px-3 file:py-1.5 file:text-sm file:font-semibold file:text-white"
            />
            <span className="mt-1 block text-xs text-slate-500">
              PDF, JPG, PNG, WEBP, or DOCX — max 10MB
            </span>
          </label>

          <button
            type="submit"
            className="w-full rounded-lg bg-violet-500 px-5 py-3 font-semibold hover:bg-violet-400"
          >
            Upload material
          </button>
        </form>
      </section>
    </main>
  );
}