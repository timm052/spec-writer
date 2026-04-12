import { NextResponse } from 'next/server';
import { addClauseToProject } from '@spec-writer/db';
import { AddClauseToProjectSchema } from '@spec-writer/core';

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function POST(request: Request, { params }: RouteContext) {
  try {
    const { id } = await params;
    const body: unknown = await request.json();
    const parsed = AddClauseToProjectSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? 'Invalid input', code: 'VALIDATION_ERROR' },
        { status: 400 },
      );
    }
    const projectClause = await addClauseToProject(id, parsed.data);
    return NextResponse.json(projectClause, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'Failed to add clause', code: 'CREATE_ERROR' }, { status: 500 });
  }
}
