export default function HomeLoading() {
  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16 animate-pulse">
      {/* Hero skeleton */}
      <div className="mb-16">
        <div className="h-10 bg-gray-200 rounded-lg w-80 mb-3" />
        <div className="h-10 bg-gray-200 rounded-lg w-56 mb-6" />
        <div className="h-5 bg-gray-100 rounded w-96 mb-2" />
        <div className="h-5 bg-gray-100 rounded w-80 mb-8" />
        <div className="flex gap-3">
          <div className="h-10 w-36 bg-blue-200 rounded-lg" />
          <div className="h-10 w-36 bg-gray-200 rounded-lg" />
        </div>
      </div>
      {/* Quick links skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-12">
        <div className="bg-white rounded-xl border border-gray-200 p-5 h-24" />
        <div className="bg-white rounded-xl border border-gray-200 p-5 h-24" />
      </div>
      {/* Recent projects skeleton */}
      <div>
        <div className="h-3 bg-gray-200 rounded w-32 mb-3" />
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-12 bg-white rounded-lg border border-gray-200" />
          ))}
        </div>
      </div>
    </div>
  );
}
