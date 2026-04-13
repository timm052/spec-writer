import { NextResponse } from 'next/server';
import { getClauseSetById, updateClauseSet, deleteClauseSet } from '@spec-writer/db';
import { z } from 'zod';

interface RouteContext {
  params: Promise<{ id: string }>;
}

const UpdateClauseSetSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional(),
});

export async function GET(_req: Request, { params }: RouteContext) {
  try {
    const { id } = await params;
    const set = await getClauseSetById(id);
    if (!set) {
      return NextResponse.json({ error: 'Clause set not found', code: 'NOT_FOUND' }, { status: 404 });
    }
    return NextResponse.json(set);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Failed to fetch clause set', code: 'FETCH_ERROR' }, { status: 500 });
  }
}

export async function PATCH(request: Request, { params }: RouteContext) {
  try {
    const { id } = await params;
    const body: unknown = await request.json();
    const parsed = UpdateClauseSetSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? 'Invalid input', code: 'VALIDATION_ERROR' },
        { status: 400 },
      );
    }
    const set = await updateClauseSet(id, parsed.data);
    return NextResponse.json(set);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Failed to update clause set', code: 'UPDATE_ERROR' }, { status: 500 });
  }
}

export async function DELETE(_req: Request, { params }: RouteContext) {
  try {
    const { id } = await params;
    await deleteClauseSet(id);
    return new NextResponse(null, { status: 204 });
  } catch (err) {
    console.error('DELETE /api/clause-sets/[id]', err);
    return NextResponse.json({ error: 'Failed to delete clause set', code: 'DELETE_ERROR' }, { status: 500 });
  }
}
