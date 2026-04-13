export default function ProjectsLoading() {
  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 animate-pulse">
      <div className="flex items-center justify-between mb-8">
        <div className="h-8 bg-gray-200 rounded w-32" />
        <div className="h-9 bg-blue-200 rounded-lg w-36" />
      </div>
      <div className="space-y-3">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="bg-white rounded-xl border border-gray-200 p-5">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="h-5 bg-gray-200 rounded w-48 mb-2" />
                <div className="h-3.5 bg-gray-100 rounded w-32" />
              </div>
              <div className="h-4 bg-gray-100 rounded w-20" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
