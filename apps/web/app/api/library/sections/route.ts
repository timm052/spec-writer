import { NextResponse } from 'next/server';
import { getSections, createSection, getDefaultClauseSet } from '@spec-writer/db';
import { z } from 'zod';

const CreateSectionSchema = z.object({
  clauseSetId: z.string().uuid().optional(),
  code: z.string().min(1, 'Code is required'),
  title: z.string().min(1, 'Title is required'),
  sortOrder: z.number().int().min(0).optional(),
});

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const setId = searchParams.get('setId') ?? undefined;
    const rows = await getSections(setId);
    return NextResponse.json(rows);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Failed to fetch sections', code: 'FETCH_ERROR' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body: unknown = await request.json();
    const parsed = CreateSectionSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? 'Invalid input', code: 'VALIDATION_ERROR' },
        { status: 400 },
      );
    }

    let clauseSetId = parsed.data.clauseSetId;
    if (!clauseSetId) {
      const defaultSet = await getDefaultClauseSet();
      if (!defaultSet) {
        return NextResponse.json(
          { error: 'No clause sets exist — create one first', code: 'NO_CLAUSE_SET' },
          { status: 400 },
        );
      }
      clauseSetId = defaultSet.id;
    }

    const section = await createSection({
      clauseSetId,
      code: parsed.data.code,
      title: parsed.data.title,
      sortOrder: parsed.data.sortOrder,
    });
    return NextResponse.json(section, { status: 201 });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Failed to create section', code: 'CREATE_ERROR' }, { status: 500 });
  }
}
