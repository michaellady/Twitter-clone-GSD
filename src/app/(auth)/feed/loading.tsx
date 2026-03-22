export default function FeedLoading() {
  return (
    <div className="min-h-screen bg-white">
      <div className="flex h-14 items-center justify-between border-b border-gray-300 bg-white px-4">
        <span className="text-xl font-semibold text-slate-900">Chirp</span>
      </div>
      <main className="mx-auto max-w-[600px]">
        <div className="animate-pulse space-y-4 p-4">
          <div className="h-20 rounded bg-slate-100" />
          <div className="h-24 rounded bg-slate-100" />
          <div className="h-24 rounded bg-slate-100" />
          <div className="h-24 rounded bg-slate-100" />
        </div>
      </main>
    </div>
  );
}
