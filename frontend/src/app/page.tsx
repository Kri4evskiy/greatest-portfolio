export default function Home() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-5xl flex-col justify-center px-6 py-16 sm:px-10 lg:px-12">
      <div className="max-w-3xl space-y-8">
        <p className="text-sm font-medium uppercase tracking-[0.24em] text-zinc-500">
          Bootstrap phase
        </p>
        <div className="space-y-4">
          <h1 className="text-5xl font-semibold tracking-tight text-zinc-950 sm:text-6xl">
            Greatest Portfolio
          </h1>
          <p className="max-w-2xl text-lg leading-8 text-zinc-600 sm:text-xl">
            Next.js frontend, Python backend, Supabase foundation.
          </p>
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="rounded-2xl border border-zinc-200 bg-white p-5">
            <p className="text-sm font-medium text-zinc-500">Frontend</p>
            <p className="mt-2 text-base text-zinc-950">
              Next.js 16, Tailwind 4, Biome, Playwright
            </p>
          </div>
          <div className="rounded-2xl border border-zinc-200 bg-white p-5">
            <p className="text-sm font-medium text-zinc-500">Backend</p>
            <p className="mt-2 text-base text-zinc-950">FastAPI, SQLAlchemy 2, Alembic, pytest</p>
          </div>
          <div className="rounded-2xl border border-zinc-200 bg-white p-5">
            <p className="text-sm font-medium text-zinc-500">Docs</p>
            <p className="mt-2 text-base text-zinc-950">Plan, architecture, decisions, structure</p>
          </div>
        </div>
      </div>
    </main>
  );
}
