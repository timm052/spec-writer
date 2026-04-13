import { NextResponse } from 'next/server';
import { getSections, createSection, getDefaultClauseSet } from '@spec-writer/db';
import { z } from 'zod';

const CreateSectionSchema = z.object({
  clauseSetId: z.string().uuid('Invalid clause set ID'),
  code: z.string().min(1),
  title: z.string().min(1),
  sortOrder: z.number().int().min(0).optional(),
});

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const setId = searchParams.get('setId') ?? undefined;
    const sections = await getSections(setId);
    return NextResponse.json(sections);
  } catch {
    return NextResponse.json({ error: 'Failed to fetch sections', code: 'FETCH_ERROR' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body: unknown = await request.json();

    // If no clauseSetId provided, fall back to the default set
    let input = body as Record<string, unknown>;
    if (!input.clauseSetId) {
      const defaultSet = await getDefaultClauseSet();
      if (!defaultSet) {
        return NextResponse.json({ error: 'No clause set found', code: 'NOT_FOUND' }, { status: 404 });
      }
      input = { ...input, clauseSetId: defaultSet.id };
    }

    const parsed = CreateSectionSchema.safeParse(input);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? 'Invalid input', code: 'VALIDATION_ERROR' },
        { status: 400 },
      );
    }
    const section = await createSection(parsed.data);
    return NextResponse.json(section, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'Failed to create section', code: 'CREATE_ERROR' }, { status: 500 });
  }
}
