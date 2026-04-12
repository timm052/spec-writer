import { NextResponse } from 'next/server';
import { duplicateProject } from '@spec-writer/db';

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function POST(_req: Request, { params }: RouteContext) {
  try {
    const { id } = await params;
    const newProject = await duplicateProject(id);
    return NextResponse.json(newProject, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'Failed to duplicate project', code: 'DUPLICATE_ERROR' }, { status: 500 });
  }
}
