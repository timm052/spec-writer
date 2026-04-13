import { NextResponse } from 'next/server';
import { searchClauses, createClause, getSections, getDefaultClauseSet } from '@spec-writer/db';
import { z } from 'zod';

const CreateClauseSchema = z.object({
  sectionId: z.string().uuid(),
  code: z.string().min(1),
  title: z.string().min(1),
  body: z.string().default(''),
  tags: z.array(z.string()).optional(),
  source: z.enum(['natspec', 'practice', 'project']).optional(),
});

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const q = searchParams.get('q') ?? undefined;
    const section = searchParams.get('section') ?? undefined;
    const tags = searchParams.get('tags') ?? undefined;
    const setId = searchParams.get('setId') ?? undefined;
    const results = await searchClauses({ q, section, tags, clauseSetId: setId });
    return NextResponse.json(results);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Failed to fetch clauses', code: 'FETCH_ERROR' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body: unknown = await request.json();
    const parsed = CreateClauseSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? 'Invalid input', code: 'VALIDATION_ERROR' },
        { status: 400 },
      );
    }
    const clause = await createClause(parsed.data);
    return NextResponse.json(clause, { status: 201 });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Failed to create clause', code: 'CREATE_ERROR' }, { status: 500 });
  }
}
