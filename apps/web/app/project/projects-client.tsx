'use client';

import { useState } from 'react';
import type { Project } from '@spec-writer/db';

type ProjectWithCount = Project & { clauseCount: number };
import { ProjectCard } from '../../components/project/project-card';
import { CreateProjectModal } from '../../components/project/create-project-modal';
import { Button } from '../../components/shared';
import { useRouter } from 'next/navigation';

interface ProjectsClientProps {
  initialProjects: ProjectWithCount[];
}

export function ProjectsClient({ initialProjects }: ProjectsClientProps) {
  const [showCreate, setShowCreate] = useState(false);
  const router = useRouter();

  function handleCreated(project: { id: string; name: string }) {
    router.push(`/project/${project.id}`);
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Projects</h1>
          <p className="mt-1 text-sm text-gray-500">
            {initialProjects.length === 0
              ? 'No projects yet.'
              : `${initialProjects.length} project${initialProjects.length === 1 ? '' : 's'}`}
          </p>
        </div>
        <Button onClick={() => setShowCreate(true)} aria-label="Create new project">
          + New Project
        </Button>
      </div>

      {initialProjects.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-xl border border-dashed border-gray-300">
          <p className="text-4xl mb-3">📋</p>
          <p className="text-gray-600 font-medium mb-1">No projects yet</p>
          <p className="text-sm text-gray-400 mb-6">Create your first specification project to get started.</p>
          <Button onClick={() => setShowCreate(true)}>Create Project</Button>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 divide-y divide-gray-100 shadow-sm">
          {initialProjects.map((project) => (
            <ProjectCard key={project.id} project={project} clauseCount={project.clauseCount} />
          ))}
        </div>
      )}

      <CreateProjectModal
        open={showCreate}
        onClose={() => setShowCreate(false)}
        onCreated={handleCreated}
      />
    </div>
  );
}
