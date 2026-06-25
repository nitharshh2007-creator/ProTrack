export const DashboardSkeleton = () => (
  <div className="space-y-8 animate-pulse">
    <div className="premium-hero p-8">
      <div className="h-4 w-32 rounded bg-white/5" />
      <div className="mt-4 h-12 w-72 rounded bg-white/10" />
      <div className="mt-4 h-4 w-96 max-w-full rounded bg-white/5" />
      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        {Array.from({ length: 3 }).map((_, index) => (
          <div key={index} className="rounded-xl bg-[#090D1A] p-4 border border-white/5">
            <div className="h-3 w-24 rounded bg-white/5" />
            <div className="mt-4 h-8 w-16 rounded bg-white/10" />
          </div>
        ))}
      </div>
    </div>

    <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
      {Array.from({ length: 6 }).map((_, index) => (
        <div key={index} className="premium-card p-6 shadow-sm">
          <div className="h-3 w-20 rounded bg-white/10" />
          <div className="mt-5 h-9 w-16 rounded bg-white/20" />
          <div className="mt-4 h-3 w-28 rounded bg-white/5" />
        </div>
      ))}
    </div>

    <div className="grid gap-8 xl:grid-cols-2">
      <div className="premium-card p-6 shadow-sm">
        <div className="h-4 w-48 rounded bg-white/10" />
        <div className="mt-6 h-64 rounded-2xl bg-[#090D1A] border border-white/5" />
      </div>
      <div className="premium-card p-6 shadow-sm">
        <div className="h-4 w-40 rounded bg-white/10" />
        <div className="mt-6 space-y-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="h-16 rounded-2xl bg-[#090D1A] border border-white/5" />
          ))}
        </div>
      </div>
    </div>
  </div>
);
