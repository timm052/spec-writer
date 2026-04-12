import { NextResponse } from 'next/server';
import { getClauseById, updateClause, deleteClause } from '@spec-writer/db';
import { z } from 'zod';

interface RouteContext {
  params: Promise<{ id: string }>;
}

const UpdateClauseSchema = z.object({
  sectionId: z.string().uuid().optional(),
  code: z.string().min(1).optional(),
  title: z.string().min(1).optional(),
  body: z.string().optional(),
  tags: z.array(z.string()).optional(),
  source: z.enum(['natspec', 'practice', 'project']).optional(),
});

export async function GET(_req: Request, { params }: RouteContext) {
  try {
    const { id } = await params;
    const clause = await getClauseById(id);
    if (!clause) {
      return NextResponse.json({ error: 'Clause not found', code: 'NOT_FOUND' }, { status: 404 });
    }
    return NextResponse.json(clause);
  } catch {
    return NextResponse.json({ error: 'Failed to fetch clause', code: 'FETCH_ERROR' }, { status: 500 });
  }
}

export async function PATCH(request: Request, { params }: RouteContext) {
  try {
    const { id } = await params;
    const body: unknown = await request.json();
    const parsed = UpdateClauseSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? 'Invalid input', code: 'VALIDATION_ERROR' },
        { status: 400 },
      );
    }
    const clause = await updateClause(id, parsed.data);
    return NextResponse.json(clause);
  } catch {
    return NextResponse.json({ error: 'Failed to update clause', code: 'UPDATE_ERROR' }, { status: 500 });
  }
}

export async function DELETE(_req: Request, { params }: RouteContext) {
  try {
    const { id } = await params;
    await deleteClause(id);
    return new NextResponse(null, { status: 204 });
  } catch {
    return NextResponse.json({ error: 'Failed to delete clause', code: 'DELETE_ERROR' }, { status: 500 });
  }
}
