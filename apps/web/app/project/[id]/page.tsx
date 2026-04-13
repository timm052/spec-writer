import { notFound } from 'next/navigation';
import Link from 'next/link';
import { getProjectById, getProjectSpec, getProjectIssues, getClauseSets } from '@spec-writer/db';
import { ProjectVariablesEditor } from '../../../components/project/project-variables-editor';
import { ProjectActions } from '../../../components/project/project-actions';
import { ExportButton } from '../../../components/project/export-button';
import { ProjectStatusSelect } from '../../../components/project/project-status-select';
import { ProjectClauseSetSelect } from '../../../components/project/project-clause-set-select';
import { IssueRegister } from '../../../components/project/issue-register';
import { Badge } from '../../../components/shared';

export const dynamic = 'force-dynamic';

interface ProjectPageProps {
  params: Promise<{ id: string }>;
}

export default async function ProjectDetailPage({ params }: ProjectPageProps) {
  const { id } = await params;
  const project = await getProjectById(id);
  if (!project) notFound();

  const [specRows, issues, clauseSets] = await Promise.all([
    getProjectSpec(id),
    getProjectIssues(id),
    getClauseSets(),
  ]);
  const includedRows = specRows.filter((r) => r.included);

  const sectionMap = new Map<string, {
    id: string;
    code: string;
    title: string;
    clauses: Array<{
      projectClauseId: string;
      code: string;
      title: string;
      bodyOverride: string | null;
    }>;
  }>();

  for (const row of includedRows) {
    const sid = row.section.id;
    if (!sectionMap.has(sid)) {
      sectionMap.set(sid, { id: sid, code: row.section.code, title: row.section.title, clauses: [] });
    }
    sectionMap.get(sid)!.clauses.push({
      projectClauseId: row.id,
      code: row.clause.code,
      title: row.clause.title,
      bodyOverride: row.bodyOverride,
    });
  }

  const sections = Array.from(sectionMap.values()).sort((a, b) => a.code.localeCompare(b.code));
  const projectVariables = project.variables ?? {};

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Header */}
      <div className="mb-8">
        <Link href="/project" className="text-xs text-gray-400 hover:text-gray-600 mb-3 inline-flex items-center gap-1">
          ← Projects
        </Link>
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{project.name}</h1>
            <div className="flex items-center gap-3 mt-1 text-sm text-gray-500">
              {project.number && <span className="font-mono text-xs bg-gray-100 px-1.5 py-0.5 rounded text-gray-500">{project.number}</span>}
              {project.client && <span>{project.client}</span>}
              {project.address && <span>{project.address}</span>}
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0 flex-wrap justify-end">
            <ProjectClauseSetSelect
              projectId={project.id}
              clauseSets={clauseSets}
              activeSetId={project.clauseSetId ?? null}
            />
            <ProjectStatusSelect projectId={project.id} status={(project.status ?? 'draft') as 'draft' | 'in-review' | 'issued'} />
            <ProjectActions project={{ id: project.id, name: project.name, number: project.number, client: project.client, address: project.address }} />
            <ExportButton projectId={project.id} projectName={project.name} />
            <Link
              href={`/editor/${project.id}`}
              className="inline-flex items-center px-4 py-2 rounded-lg text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 transition-colors shadow-sm"
            >
              Edit Spec →
            </Link>
          </div>
        </div>
      </div>

      <div className="space-y-6">
        {/* Variables */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
          <div className="px-6 py-4 border-b border-gray-100">
            <h2 className="text-sm font-semibold text-gray-900">Project Variables</h2>
            <p className="text-xs text-gray-400 mt-0.5">Override clause tokens for this project</p>
          </div>
          <div className="p-6">
            <ProjectVariablesEditor projectId={project.id} variables={projectVariables} />
          </div>
        </div>

        {/* Issue register */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
          <div className="px-6 py-4 border-b border-gray-100">
            <h2 className="text-sm font-semibold text-gray-900">Issue Register</h2>
            <p className="text-xs text-gray-400 mt-0.5">Track revisions and issue dates</p>
          </div>
          <div className="p-6">
            <IssueRegister
              projectId={project.id}
              initialIssues={issues.map((i) => ({
                id: i.id,
                revision: i.revision,
                description: i.description,
                issuedAt: i.issuedAt?.toISOString() ?? new Date().toISOString(),
              }))}
            />
          </div>
        </div>

        {/* Spec overview */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
          <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-semibold text-gray-900">Specification</h2>
              <p className="text-xs text-gray-400 mt-0.5">{includedRows.length} clause{includedRows.length === 1 ? '' : 's'} included</p>
            </div>
            <div className="flex items-center gap-4">
              <Link
                href={`/library?projectId=${project.id}${project.clauseSetId ? `&setId=${project.clauseSetId}` : ''}`}
                className="text-xs text-gray-500 hover:text-blue-600"
              >
                + Add clauses
              </Link>
              {includedRows.length > 0 && (
                <Link href={`/editor/${project.id}`} className="text-xs text-blue-600 hover:underline">
                  Edit →
                </Link>
              )}
            </div>
          </div>
          <div className="divide-y divide-gray-50">
            {sections.length === 0 ? (
              <div className="px-6 py-12 text-center">
                <p className="text-sm text-gray-500 mb-3">No clauses added yet.</p>
                <Link
                  href={`/library?projectId=${project.id}${project.clauseSetId ? `&setId=${project.clauseSetId}` : ''}`}
                  className="text-sm text-blue-600 hover:underline"
                >
                  Browse the library to add clauses →
                </Link>
              </div>
            ) : (
              sections.map((section) => (
                <div key={section.id} className="px-6 py-4">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
                    {section.code} — {section.title}
                  </p>
                  <div className="space-y-2">
                    {section.clauses.map((clause) => (
                      <div key={clause.projectClauseId} className="flex items-center justify-between py-1">
                        <div className="flex items-center gap-3 min-w-0">
                          <span className="text-xs font-mono text-gray-400 shrink-0">{clause.code}</span>
                          <span className="text-sm text-gray-700 truncate">{clause.title}</span>
                        </div>
                        {clause.bodyOverride && (
                          <Badge variant="warning" className="shrink-0 ml-2 text-xs">Overridden</Badge>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
