import { NextResponse } from 'next/server';
import { updateProjectClause } from '@spec-writer/db';
import { z } from 'zod';

const ReorderSchema = z.object({
  items: z.array(
    z.object({
      projectClauseId: z.string().min(1),
      sortOrder: z.number().int().min(0),
    }),
  ).min(1),
});

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function POST(request: Request, { params }: RouteContext) {
  try {
    const { id } = await params;
    const body: unknown = await request.json();
    const parsed = ReorderSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? 'Invalid input', code: 'VALIDATION_ERROR' },
        { status: 400 },
      );
    }
    await Promise.all(
      parsed.data.items.map(({ projectClauseId, sortOrder }) =>
        updateProjectClause(id, projectClauseId, { sortOrder }),
      ),
    );
    return new NextResponse(null, { status: 204 });
  } catch (err) {
    console.error('Failed to reorder clauses:', err);
    return NextResponse.json({ error: 'Failed to reorder clauses', code: 'REORDER_ERROR' }, { status: 500 });
  }
}
