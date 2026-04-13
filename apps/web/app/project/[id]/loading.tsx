export default function ProjectDetailLoading() {
  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 animate-pulse">
      {/* Header */}
      <div className="mb-8">
        <div className="h-3.5 bg-gray-200 rounded w-24 mb-4" />
        <div className="flex items-start justify-between">
          <div>
            <div className="h-8 bg-gray-200 rounded w-64 mb-2" />
            <div className="h-4 bg-gray-100 rounded w-40" />
          </div>
          <div className="h-9 bg-blue-200 rounded-lg w-36" />
        </div>
      </div>
      {/* Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-xl border border-gray-200 p-6 h-48" />
          <div className="bg-white rounded-xl border border-gray-200 p-6 h-36" />
          <div className="bg-white rounded-xl border border-gray-200 p-6 h-32" />
        </div>
        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-gray-200 p-6 h-40" />
          <div className="bg-white rounded-xl border border-gray-200 p-6 h-28" />
        </div>
      </div>
    </div>
  );
}
