export default function LibraryLoading() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-pulse">
      <div className="flex items-center justify-between mb-6">
        <div className="h-7 bg-gray-200 rounded w-40" />
        <div className="h-8 bg-gray-100 rounded-lg w-48" />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Section tree skeleton */}
        <aside className="lg:col-span-1">
          <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-3">
            <div className="h-3 bg-gray-200 rounded w-16 mb-4" />
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="h-6 bg-gray-100 rounded" style={{ width: `${60 + (i % 3) * 15}%` }} />
            ))}
          </div>
        </aside>
        {/* Clause list skeleton */}
        <div className="lg:col-span-3">
          <div className="h-10 bg-gray-200 rounded-lg w-full mb-6" />
          <div className="h-3 bg-gray-100 rounded w-20 mb-4" />
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="bg-white rounded-xl border border-gray-200 p-5 h-20" />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
