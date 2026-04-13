export default function EditorLoading() {
  return (
    <div className="min-h-screen bg-gray-50 flex animate-pulse">
      {/* Sidebar skeleton */}
      <div className="w-64 bg-white shadow-lg flex-shrink-0">
        <div className="p-4 border-b">
          <div className="h-3.5 bg-gray-200 rounded w-28 mb-3" />
          <div className="h-5 bg-gray-200 rounded w-40 mb-4" />
          <div className="h-8 bg-blue-100 rounded-lg w-full mb-2" />
          <div className="h-4 bg-gray-100 rounded w-20" />
        </div>
        <div className="p-4 space-y-2">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-9 bg-gray-100 rounded-lg" />
          ))}
        </div>
      </div>
      {/* Main content skeleton */}
      <div className="flex-1 overflow-auto p-8">
        <div className="max-w-4xl">
          <div className="flex items-center justify-between mb-6">
            <div className="h-8 bg-gray-200 rounded w-56" />
            <div className="h-9 bg-gray-200 rounded-lg w-44" />
          </div>
          {/* Section blocks */}
          {[1, 2].map((s) => (
            <div key={s} className="mb-8">
              <div className="h-6 bg-gray-200 rounded w-48 mb-4" />
              <div className="space-y-4">
                {[1, 2, 3].map((c) => (
                  <div key={c} className="bg-white rounded-lg border border-gray-200 p-5 h-24" />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
