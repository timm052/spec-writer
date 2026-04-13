import { NextResponse } from 'next/server';
import { getProjectById, updateProject, deleteProject } from '@spec-writer/db';
import { UpdateProjectSchema } from '@spec-writer/core';

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
    return NextResponse.json(project);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Failed to fetch project', code: 'FETCH_ERROR' }, { status: 500 });
  }
}

export async function PATCH(request: Request, { params }: RouteContext) {
  try {
    const { id } = await params;
    const body: unknown = await request.json();
    const parsed = UpdateProjectSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? 'Invalid input', code: 'VALIDATION_ERROR' },
        { status: 400 },
      );
    }
    const project = await updateProject(id, parsed.data);
    return NextResponse.json(project);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Failed to update project', code: 'UPDATE_ERROR' }, { status: 500 });
  }
}

export async function DELETE(_req: Request, { params }: RouteContext) {
  try {
    const { id } = await params;
    await deleteProject(id);
    return new NextResponse(null, { status: 204 });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Failed to delete project', code: 'DELETE_ERROR' }, { status: 500 });
  }
}
