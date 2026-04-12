import { getProjectsWithClauseCounts } from '@spec-writer/db';
import { ProjectsClient } from './projects-client';

export const dynamic = 'force-dynamic';

export default async function ProjectsPage() {
  const projects = await getProjectsWithClauseCounts();
  return <ProjectsClient initialProjects={projects} />;
}
