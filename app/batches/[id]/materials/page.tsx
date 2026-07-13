import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { deleteMaterial } from "@/app/batches/[id]/materials/actions";

const SIGNED_URL_EXPIRY_SECONDS = 60 * 10; // 10 minutes

export default async function MaterialsPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const { id } = await params;
  const { error: errorParam } = await searchParams;
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

  const { data: materials, error } = await supabase
    .from("materials")
    .select("*")
    .eq("batch_id", id)
    .order("chapter", { ascending: true })
    .order("created_at", { ascending: false });

  const materialsWithUrls = await Promise.all(
    (materials || []).map(async (material) => {
      const { data: signed } = await supabase.storage
        .from("materials")
        .createSignedUrl(material.file_path, SIGNED_URL_EXPIRY_SECONDS);
      return { ...material, signedUrl: signed?.signedUrl || null };
    })
  );

  const byChapter = new Map<string, typeof materialsWithUrls>();
  for (const material of materialsWithUrls) {
    const list = byChapter.get(material.chapter) || [];
    list.push(material);
    byChapter.set(material.chapter, list);
  }

  return (
    <main className="min-h-screen bg-slate-950 px-6 py-12 text-white">
      <section className="mx-auto w-full max-w-3xl">
        <Link
          href={`/batches/${id}`}
          className="text-sm font-semibold text-violet-300"
        >
          ← Back to {batch.name}
        </Link>

        <div className="mt-6 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold">Study materials</h1>
            <p className="mt-1 text-slate-400">{batch.name}</p>
          </div>
          <Link
            href={`/batches/${id}/materials/new`}
            className="rounded-lg bg-violet-500 px-5 py-2.5 font-semibold hover:bg-violet-400"
          >
            + Upload material
          </Link>
        </div>

        {errorParam ? (
          <p className="mt-6 rounded-lg border border-red-900 bg-red-950/50 p-3 text-sm text-red-200">
            {errorParam}
          </p>
        ) : null}

        {error ? (
          <div className="mt-8 rounded-xl border border-red-900 bg-red-950/30 p-8 text-center">
            <p className="text-red-200">Could not load materials.</p>
            <Link
              href={`/batches/${id}/materials`}
              className="mt-3 inline-block text-sm font-semibold text-violet-300"
            >
              Try again
            </Link>
          </div>
        ) : materialsWithUrls.length === 0 ? (
          <div className="mt-8 rounded-xl border border-slate-800 bg-slate-900 p-12 text-center">
            <p className="text-lg font-semibold">No materials yet</p>
            <p className="mt-2 text-slate-400">
              Upload your first note or resource for this batch.
            </p>
            <Link
              href={`/batches/${id}/materials/new`}
              className="mt-5 inline-block rounded-lg bg-violet-500 px-5 py-2.5 font-semibold hover:bg-violet-400"
            >
              + Upload material
            </Link>
          </div>
        ) : (
          <div className="mt-8 space-y-8">
            {Array.from(byChapter.entries()).map(([chapter, items]) => (
              <div key={chapter}>
                <h2 className="text-lg font-semibold text-violet-300">
                  {chapter}
                </h2>
                <ul className="mt-3 divide-y divide-slate-800 rounded-xl border border-slate-800 bg-slate-900">
                  {items.map((material) => {
                    const deleteMaterialWithIds = deleteMaterial.bind(
                      null,
                      id,
                      material.id,
                      material.file_path
                    );

                    return (
                      <li
                        key={material.id}
                        className="flex flex-wrap items-center justify-between gap-3 px-5 py-4"
                      >
                        <div>
                          <p className="font-medium">{material.title}</p>
                          {material.description ? (
                            <p className="mt-1 text-sm text-slate-400">
                              {material.description}
                            </p>
                          ) : null}
                        </div>
                        <div className="flex items-center gap-3">
                          {material.signedUrl ? (
                            <a>
                              href={material.signedUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="rounded-lg bg-violet-500 px-4 py-2 text-sm font-semibold hover:bg-violet-400"
                            
                              Download
                            </a>
                          ) : (
                            <span className="text-sm text-red-400">
                              Link unavailable
                            </span>
                          )}
                          <form action={deleteMaterialWithIds}>
                            <button
                              type="submit"
                              className="rounded-lg border border-red-900 px-3 py-2 text-sm font-semibold text-red-300 hover:bg-red-950/50"
                            >
                              Delete
                            </button>
                          </form>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}