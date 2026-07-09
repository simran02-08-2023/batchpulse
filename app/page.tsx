export default function Home() {
  return (
    <main className="min-h-screen bg-slate-950 px-6 py-16 text-white">
      <section className="mx-auto max-w-5xl">
        <p className="mb-4 text-sm font-semibold tracking-widest text-violet-300">
          BATCHPULSE
        </p>

        <h1 className="max-w-3xl text-4xl font-bold tracking-tight sm:text-6xl">
          Know which students need support before they fall behind.
        </h1>

        <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-300">
          BatchPulse helps coaching centres track attendance, homework, and test
          performance in one clear dashboard.
        </p>

        <div className="mt-8 flex flex-wrap gap-4">
          <a
            href="/login"
            className="rounded-lg bg-violet-500 px-5 py-3 font-semibold text-white transition hover:bg-violet-400"
          >
            Try demo
          </a>

          <a
            href="#features"
            className="rounded-lg border border-slate-700 px-5 py-3 font-semibold text-slate-200 transition hover:bg-slate-900"
          >
            Explore features
          </a>
        </div>
      </section>

      <section
        id="features"
        className="mx-auto mt-24 grid max-w-5xl gap-5 md:grid-cols-3"
      >
        <article className="rounded-xl border border-slate-800 bg-slate-900 p-6">
          <h2 className="text-xl font-semibold">Attendance tracking</h2>
          <p className="mt-3 text-slate-400">
            Mark attendance quickly and spot students with frequent absences.
          </p>
        </article>

        <article className="rounded-xl border border-slate-800 bg-slate-900 p-6">
          <h2 className="text-xl font-semibold">Performance insights</h2>
          <p className="mt-3 text-slate-400">
            Track tests, homework, and learning progress across every batch.
          </p>
        </article>

        <article className="rounded-xl border border-slate-800 bg-slate-900 p-6">
          <h2 className="text-xl font-semibold">Attention score</h2>
          <p className="mt-3 text-slate-400">
            Identify students who may need help using transparent, actionable
            signals.
          </p>
        </article>
      </section>
    </main>
  );
}