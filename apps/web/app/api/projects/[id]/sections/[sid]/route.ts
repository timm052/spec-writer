import { NextResponse } from 'next/server';
import { z } from 'zod';
import { updateProjectSectionOrder } from '@spec-writer/db';

interface RouteContext {
  params: Promise<{ id: string; sid: string }>;
}

const PatchSchema = z.object({
  sortOrder: z.number().int().min(0),
});

export async function PATCH(req: Request, { params }: RouteContext) {
  try {
    const { id: projectId, sid: sectionId } = await params;
    const body = await req.json() as unknown;
    const parsed = PatchSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation failed', code: 'VALIDATION_ERROR', issues: parsed.error.issues },
        { status: 400 },
      );
    }
    const updated = await updateProjectSectionOrder(projectId, sectionId, parsed.data.sortOrder);
    return NextResponse.json(updated);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    if (message.includes('not found')) {
      return NextResponse.json({ error: message, code: 'NOT_FOUND' }, { status: 404 });
    }
    return NextResponse.json({ error: 'Failed to update section order', code: 'UPDATE_ERROR' }, { status: 500 });
  }
}
