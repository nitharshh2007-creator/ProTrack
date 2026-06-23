export const DashboardSkeleton = () => (
  <div className="space-y-8 animate-pulse">
    <div className="rounded-[28px] bg-white/70 p-8">
      <div className="h-4 w-32 rounded bg-slate-200" />
      <div className="mt-4 h-12 w-72 rounded bg-slate-200" />
      <div className="mt-4 h-4 w-96 max-w-full rounded bg-slate-200" />
      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        {Array.from({ length: 3 }).map((_, index) => (
          <div key={index} className="rounded-2xl bg-slate-100 p-4">
            <div className="h-3 w-24 rounded bg-slate-200" />
            <div className="mt-4 h-8 w-16 rounded bg-slate-200" />
          </div>
        ))}
      </div>
    </div>

    <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
      {Array.from({ length: 6 }).map((_, index) => (
        <div key={index} className="rounded-[18px] bg-white p-6 shadow-sm">
          <div className="h-3 w-20 rounded bg-slate-200" />
          <div className="mt-5 h-9 w-16 rounded bg-slate-200" />
          <div className="mt-4 h-3 w-28 rounded bg-slate-100" />
        </div>
      ))}
    </div>

    <div className="grid gap-8 xl:grid-cols-2">
      <div className="rounded-[24px] bg-white p-6 shadow-sm">
        <div className="h-4 w-48 rounded bg-slate-200" />
        <div className="mt-6 h-64 rounded-2xl bg-slate-100" />
      </div>
      <div className="rounded-[24px] bg-white p-6 shadow-sm">
        <div className="h-4 w-40 rounded bg-slate-200" />
        <div className="mt-6 space-y-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="h-16 rounded-2xl bg-slate-100" />
          ))}
        </div>
      </div>
    </div>
  </div>
);
