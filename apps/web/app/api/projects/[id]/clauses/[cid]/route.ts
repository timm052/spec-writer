import { NextResponse } from 'next/server';
import { updateProjectClause, removeProjectClause } from '@spec-writer/db';
import { UpdateProjectClauseSchema } from '@spec-writer/core';

interface RouteContext {
  params: Promise<{ id: string; cid: string }>;
}

export async function PATCH(request: Request, { params }: RouteContext) {
  try {
    const { id, cid } = await params;
    const body: unknown = await request.json();
    const parsed = UpdateProjectClauseSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? 'Invalid input', code: 'VALIDATION_ERROR' },
        { status: 400 },
      );
    }
    const updated = await updateProjectClause(id, cid, parsed.data);
    return NextResponse.json(updated);
  } catch {
    return NextResponse.json({ error: 'Failed to update clause', code: 'UPDATE_ERROR' }, { status: 500 });
  }
}

export async function DELETE(_req: Request, { params }: RouteContext) {
  try {
    const { cid } = await params;
    await removeProjectClause(cid);
    return new NextResponse(null, { status: 204 });
  } catch {
    return NextResponse.json({ error: 'Failed to remove clause', code: 'DELETE_ERROR' }, { status: 500 });
  }
}
