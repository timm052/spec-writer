import { NextResponse } from 'next/server';
import { searchClauses, createClause } from '@spec-writer/db';
import { z } from 'zod';

const SearchClausesSchema = z.object({
  q: z.string().optional(),
  section: z.string().optional(),
  tags: z.string().optional(),
  setId: z.string().uuid().optional(),
});

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
    const parsed = SearchClausesSchema.safeParse({
      q: searchParams.get('q') ?? undefined,
      section: searchParams.get('section') ?? undefined,
      tags: searchParams.get('tags') ?? undefined,
      setId: searchParams.get('setId') ?? undefined,
    });
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? 'Invalid input', code: 'VALIDATION_ERROR' },
        { status: 400 },
      );
    }
    const clauses = await searchClauses({
      q: parsed.data.q,
      section: parsed.data.section,
      tags: parsed.data.tags,
      clauseSetId: parsed.data.setId,
    });
    return NextResponse.json(clauses);
  } catch {
    return NextResponse.json({ error: 'Failed to search clauses', code: 'FETCH_ERROR' }, { status: 500 });
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
  } catch {
    return NextResponse.json({ error: 'Failed to create clause', code: 'CREATE_ERROR' }, { status: 500 });
  }
}
