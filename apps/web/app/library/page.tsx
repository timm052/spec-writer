import Link from 'next/link';
import { getSections, getProjectById, getAllTags } from '@spec-writer/db';
import { LibraryBrowser } from '../../components/library/library-browser';

export const dynamic = 'force-dynamic';

interface LibraryPageProps {
  searchParams: Promise<{ projectId?: string }>;
}

export default async function LibraryPage({ searchParams }: LibraryPageProps) {
  const { projectId } = await searchParams;

  const [sections, project, availableTags] = await Promise.all([
    getSections(),
    projectId ? getProjectById(projectId) : Promise.resolve(null),
    getAllTags(),
  ]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="mb-10 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Clause Library</h1>
          <p className="mt-1 text-sm text-gray-500">
            Search and browse {sections.length} section{sections.length === 1 ? '' : 's'} of base clauses.
          </p>
          {project && (
            <p className="mt-2 text-sm text-blue-600 font-medium">
              Adding to: {project.name}
            </p>
          )}
        </div>
        <Link
          href="/library/manage"
          className="shrink-0 inline-flex items-center px-3 py-1.5 rounded-lg text-sm font-medium text-gray-600 bg-white border border-gray-200 hover:border-gray-300 hover:text-gray-900 transition-colors"
        >
          Manage library →
        </Link>
      </div>
      <LibraryBrowser
        sections={sections}
        projectId={projectId}
        availableTags={availableTags}
      />
    </div>
  );
}
