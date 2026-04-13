import { NextResponse } from 'next/server';
import { updateSection, deleteSection } from '@spec-writer/db';
import { z } from 'zod';

interface RouteContext {
  params: Promise<{ id: string }>;
}

const UpdateSectionSchema = z.object({
  code: z.string().min(1).optional(),
  title: z.string().min(1).optional(),
});

export async function PATCH(request: Request, { params }: RouteContext) {
  try {
    const { id } = await params;
    const body: unknown = await request.json();
    const parsed = UpdateSectionSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? 'Invalid input', code: 'VALIDATION_ERROR' },
        { status: 400 },
      );
    }
    const section = await updateSection(id, parsed.data);
    return NextResponse.json(section);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Failed to update section', code: 'UPDATE_ERROR' }, { status: 500 });
  }
}

export async function DELETE(_req: Request, { params }: RouteContext) {
  try {
    const { id } = await params;
    await deleteSection(id);
    return new NextResponse(null, { status: 204 });
  } catch (err) {
    console.error('DELETE /api/library/sections/[id]', err);
    return NextResponse.json({ error: 'Failed to delete section', code: 'DELETE_ERROR' }, { status: 500 });
  }
}
