import { getProjectById, getProjectSpec } from '@spec-writer/db';
import { resolveClause } from '@spec-writer/core';
import { practiceVars } from './practice-vars.js';
import type { ExportProject, ExportSection } from '@spec-writer/export';

export interface BuiltSpec {
  project: ExportProject;
  sections: ExportSection[];
}

/** Strip variable node span wrappers from resolved HTML, keeping their inner content. */
function stripVariableNodes(html: string): string {
  return html.replace(/<span[^>]+data-variable="[^"]*"[^>]*>(.*?)<\/span>/gi, '$1');
}

export async function buildSpecSections(projectId: string): Promise<BuiltSpec | null> {
  const project = await getProjectById(projectId);
  if (!project) return null;

  const specRows = await getProjectSpec(projectId);
  const projectVariables = project.variables ?? {};

  const sectionMap = new Map<
    string,
    {
      code: string;
      title: string;
      projectSectionSortOrder: number | null;
      clauses: Array<{ code: string; title: string; resolvedBody: string; sortOrder: number }>;
    }
  >();

  for (const row of specRows) {
    if (!row.included) continue;
    const sid = row.section.id;
    if (!sectionMap.has(sid)) {
      sectionMap.set(sid, {
        code: row.section.code,
        title: row.section.title,
        projectSectionSortOrder: (row as { projectSectionSortOrder?: number | null }).projectSectionSortOrder ?? null,
        clauses: [],
      });
    }
    const rawBody = row.bodyOverride ?? row.clause.body;
    const resolved = resolveClause(rawBody, projectVariables, practiceVars);
    sectionMap.get(sid)!.clauses.push({
      code: row.clause.code,
      title: row.clause.title,
      resolvedBody: stripVariableNodes(resolved),
      sortOrder: row.sortOrder,
    });
  }

  const sections: ExportSection[] = Array.from(sectionMap.values())
    .sort((a, b) => {
      if (a.projectSectionSortOrder != null && b.projectSectionSortOrder != null) {
        return a.projectSectionSortOrder - b.projectSectionSortOrder;
      }
      return a.code.localeCompare(b.code);
    })
    .map((s) => ({
      code: s.code,
      title: s.title,
      clauses: s.clauses.sort((a, b) => a.sortOrder - b.sortOrder),
    }));

  return {
    project: {
      name: project.name,
      number: project.number,
      client: project.client,
      address: project.address,
    },
    sections,
  };
}
