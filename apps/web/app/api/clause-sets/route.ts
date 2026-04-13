import { NextResponse } from 'next/server';
import { getClauseSets, createClauseSet } from '@spec-writer/db';
import { z } from 'zod';

const CreateClauseSetSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional(),
});

export async function GET() {
  try {
    const sets = await getClauseSets();
    return NextResponse.json(sets);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Failed to fetch clause sets', code: 'FETCH_ERROR' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body: unknown = await request.json();
    const parsed = CreateClauseSetSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? 'Invalid input', code: 'VALIDATION_ERROR' },
        { status: 400 },
      );
    }
    const set = await createClauseSet(parsed.data);
    return NextResponse.json(set, { status: 201 });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Failed to create clause set', code: 'CREATE_ERROR' }, { status: 500 });
  }
}
