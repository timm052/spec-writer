import Link from 'next/link';
import { getProjects } from '@spec-writer/db';

export const dynamic = 'force-dynamic';

export default async function Home() {
  const projects = await getProjects();
  const recentProjects = projects.slice(0, 3);

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      {/* Hero */}
      <div className="mb-16">
        <h1 className="text-4xl font-bold text-gray-900 mb-3 tracking-tight">
          Specification authoring<br />
          <span className="text-blue-600">built for practice.</span>
        </h1>
        <p className="text-lg text-gray-500 max-w-xl mb-8">
          Build NatSpec specifications from a searchable clause library. Override per project,
          resolve variables, and export to PDF or Word in one click.
        </p>
        <div className="flex items-center gap-3">
          <Link
            href="/project"
            className="inline-flex items-center px-5 py-2.5 rounded-lg text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 transition-colors shadow-sm"
          >
            Go to Projects
          </Link>
          <Link
            href="/library"
            className="inline-flex items-center px-5 py-2.5 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors border border-gray-200 shadow-sm"
          >
            Browse Library
          </Link>
        </div>
      </div>

      {/* Quick links */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-12">
        <Link href="/project" className="group bg-white rounded-xl border border-gray-200 p-5 hover:border-blue-300 hover:shadow-sm transition-all">
          <div className="text-2xl mb-2">📋</div>
          <h2 className="font-semibold text-gray-900 mb-1">Projects</h2>
          <p className="text-sm text-gray-500">
            {projects.length === 0 ? 'No projects yet — create your first.' : `${projects.length} project${projects.length === 1 ? '' : 's'} in progress.`}
          </p>
        </Link>
        <Link href="/library" className="group bg-white rounded-xl border border-gray-200 p-5 hover:border-blue-300 hover:shadow-sm transition-all">
          <div className="text-2xl mb-2">📚</div>
          <h2 className="font-semibold text-gray-900 mb-1">Clause Library</h2>
          <p className="text-sm text-gray-500">Search and browse NatSpec base clauses.</p>
        </Link>
      </div>

      {/* Recent projects */}
      {recentProjects.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Recent Projects</h2>
          <div className="space-y-2">
            {recentProjects.map((p) => (
              <Link
                key={p.id}
                href={`/project/${p.id}`}
                className="flex items-center justify-between bg-white rounded-lg border border-gray-200 px-4 py-3 hover:border-blue-300 hover:shadow-sm transition-all"
              >
                <div>
                  <span className="text-sm font-medium text-gray-900">{p.name}</span>
                  {p.client && <span className="ml-2 text-xs text-gray-500">{p.client}</span>}
                </div>
                {p.number && <span className="text-xs text-gray-400 font-mono">{p.number}</span>}
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
