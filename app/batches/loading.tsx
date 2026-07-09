export default function BatchesLoading() {
  return (
    <main className="min-h-screen bg-slate-950 px-6 py-12 text-white">
      <section className="mx-auto w-full max-w-5xl">
        <div className="flex items-center justify-between">
          <div>
            <div className="h-8 w-40 animate-pulse rounded bg-slate-800" />
            <div className="mt-2 h-4 w-64 animate-pulse rounded bg-slate-800" />
          </div>
          <div className="h-10 w-32 animate-pulse rounded-lg bg-slate-800" />
        </div>

        <div className="mt-6 h-10 w-full max-w-md animate-pulse rounded-lg bg-slate-800" />

        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="h-32 animate-pulse rounded-xl border border-slate-800 bg-slate-900"
            />
          ))}
        </div>
      </section>
    </main>
  );
}