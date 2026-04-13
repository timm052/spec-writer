import { NextResponse } from 'next/server';
import { getProjectById, getProjectSpec } from '@spec-writer/db';
import { resolveClause } from '@spec-writer/core';
import { practiceVars } from '../../../../../lib/practice-vars';

/** Strip variable node span wrappers from resolved HTML, keeping inner content. */
function stripVariableNodes(html: string): string {
  return html.replace(/<span[^>]+data-variable="[^"]*"[^>]*>(.*?)<\/span>/gi, '$1');
}

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(_req: Request, { params }: RouteContext) {
  try {
    const { id } = await params;
    const project = await getProjectById(id);
    if (!project) {
      return NextResponse.json({ error: 'Project not found', code: 'NOT_FOUND' }, { status: 404 });
    }

    const specRows = await getProjectSpec(id);

    // Group by section, build resolved spec
    const sectionMap = new Map<string, {
      id: string;
      code: string;
      title: string;
      projectSectionSortOrder: number | null;
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
        status: string;
        notes: string | null;
      }>;
    }>();

    const projectVariables = project.variables ?? {};

    for (const row of specRows) {
      const sectionId = row.section.id;
      if (!sectionMap.has(sectionId)) {
        sectionMap.set(sectionId, {
          id: row.section.id,
          code: row.section.code,
          title: row.section.title,
          projectSectionSortOrder: row.projectSectionSortOrder ?? null,
          clauses: [],
        });
      }
      const rawBody = row.bodyOverride ?? row.clause.body;
      const resolvedBody = stripVariableNodes(resolveClause(rawBody, projectVariables, practiceVars));
      sectionMap.get(sectionId)!.clauses.push({
        projectClauseId: row.id,
        clauseId: row.clauseId,
        code: row.clause.code,
        title: row.clause.title,
        body: rawBody,
        baseBody: row.clause.body,
        resolvedBody,
        included: row.included,
        bodyOverride: row.bodyOverride,
        sortOrder: row.sortOrder,
        status: row.status,
        notes: row.notes,
      });
    }

    // Sort sections by per-project sort order; fall back to code-alphabetical if no entry yet
    const sections = Array.from(sectionMap.values()).sort((a, b) => {
      if (a.projectSectionSortOrder != null && b.projectSectionSortOrder != null) {
        return a.projectSectionSortOrder - b.projectSectionSortOrder;
      }
      return a.code.localeCompare(b.code);
    });
    return NextResponse.json({ project, sections });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Failed to fetch spec', code: 'FETCH_ERROR' }, { status: 500 });
  }
}
