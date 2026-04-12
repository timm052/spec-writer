import Link from 'next/link';
import type { Project } from '@spec-writer/db';

interface ProjectCardProps {
  project: Project;
  clauseCount?: number;
}

export function ProjectCard({ project, clauseCount }: ProjectCardProps) {
  return (
    <Link href={`/project/${project.id}`} className="block hover:bg-blue-50/40 transition-colors">
      <div className="px-5 py-4">
        <div className="flex items-center justify-between gap-4">
          <div className="min-w-0">
            <div className="flex items-center gap-2 mb-0.5">
              <p className="text-sm font-semibold text-gray-900 truncate">{project.name}</p>
              {project.number && (
                <span className="shrink-0 text-xs text-gray-400 font-mono bg-gray-100 px-1.5 py-0.5 rounded">
                  {project.number}
                </span>
              )}
            </div>
            <div className="flex items-center gap-3 text-xs text-gray-500">
              {project.client && <span>{project.client}</span>}
              {project.address && <span className="truncate">{project.address}</span>}
            </div>
          </div>
          <div className="shrink-0 flex items-center gap-3 text-xs text-gray-400">
            {clauseCount !== undefined && (
              <span className="bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full font-medium">
                {clauseCount} clause{clauseCount === 1 ? '' : 's'}
              </span>
            )}
            {project.createdAt ? new Date(project.createdAt).toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' }) : ''}
          </div>
        </div>
      </div>
    </Link>
  );
}
