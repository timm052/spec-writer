import { getProjectById, getProjectSpec } from '@spec-writer/db';
import { resolveClause } from '@spec-writer/core';
import { buildSpecHtml } from '@spec-writer/export';
import { practiceVars } from '../../../../../lib/practice-vars';
import { NextResponse } from 'next/server';

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
    const projectVariables = project.variables ?? {};

    // Group by section, resolve variables
    const sectionMap = new Map<string, {
      code: string;
      title: string;
      sortCode: string;
      clauses: Array<{ code: string; title: string; resolvedBody: string; sortOrder: number }>;
    }>();

    for (const row of specRows) {
      if (!row.included) continue;
      const sid = row.section.id;
      if (!sectionMap.has(sid)) {
        sectionMap.set(sid, {
          code: row.section.code,
          title: row.section.title,
          sortCode: row.section.code,
          clauses: [],
        });
      }
      const rawBody = row.bodyOverride ?? row.clause.body;
      sectionMap.get(sid)!.clauses.push({
        code: row.clause.code,
        title: row.clause.title,
        resolvedBody: resolveClause(rawBody, projectVariables, practiceVars),
        sortOrder: row.sortOrder,
      });
    }

    const sections = Array.from(sectionMap.values())
      .sort((a, b) => a.sortCode.localeCompare(b.sortCode))
      .map((s) => ({
        code: s.code,
        title: s.title,
        clauses: s.clauses.sort((a, b) => a.sortOrder - b.sortOrder),
      }));

    const html = buildSpecHtml(
      { name: project.name, number: project.number, client: project.client, address: project.address },
      sections,
    );

    return new Response(html, {
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Cache-Control': 'no-store',
      },
    });
  } catch {
    return NextResponse.json({ error: 'Export failed', code: 'EXPORT_ERROR' }, { status: 500 });
  }
}
