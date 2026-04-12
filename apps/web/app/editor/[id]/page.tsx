import { notFound } from 'next/navigation';
import { getProjectById, getProjectSpec, getSections } from '@spec-writer/db';
import { resolveClause } from '@spec-writer/core';
import { practiceVars } from '../../../lib/practice-vars';
import { EditorClient } from './editor-client';

export const dynamic = 'force-dynamic';

interface EditorPageProps {
  params: Promise<{ id: string }>;
}

export default async function EditorPage({ params }: EditorPageProps) {
  const { id } = await params;
  const [project, specRows, sections] = await Promise.all([
    getProjectById(id),
    getProjectSpec(id),
    getSections(),
  ]);

  if (!project) notFound();

  const projectVariables = project.variables ?? {};

  const sectionMap = new Map<string, {
    id: string;
    code: string;
    title: string;
    clauses: Array<{
      projectClauseId: string;
      clauseId: string;
      code: string;
      title: string;
      body: string;
      baseBody: string;
      resolvedBody: string;
      included: boolean;
      bodyOverride: string | null;
      sortOrder: number;
      status: 'draft' | 'reviewed' | 'approved';
      notes: string | null;
    }>;
  }>();

  for (const row of specRows) {
    if (!row.included) continue;
    const sid = row.section.id;
    if (!sectionMap.has(sid)) {
      sectionMap.set(sid, { id: sid, code: row.section.code, title: row.section.title, clauses: [] });
    }
    const rawBody = row.bodyOverride ?? row.clause.body;
    sectionMap.get(sid)!.clauses.push({
      projectClauseId: row.id,
      clauseId: row.clauseId,
      code: row.clause.code,
      title: row.clause.title,
      body: rawBody,
      baseBody: row.clause.body,
      resolvedBody: resolveClause(rawBody, projectVariables, practiceVars),
      included: row.included,
      bodyOverride: row.bodyOverride,
      sortOrder: row.sortOrder,
      status: row.status as 'draft' | 'reviewed' | 'approved',
      notes: row.notes,
    });
  }

  const specSections = Array.from(sectionMap.values())
    .sort((a, b) => a.code.localeCompare(b.code))
    .map((s) => ({ ...s, clauses: s.clauses.sort((a, b) => a.sortOrder - b.sortOrder) }));

  return (
    <EditorClient
      project={{ id: project.id, name: project.name }}
      specSections={specSections}
      librarySections={sections}
      projectVariables={projectVariables}
    />
  );
}
