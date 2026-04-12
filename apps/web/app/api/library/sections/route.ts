import { NextResponse } from 'next/server';
import { getSections, createSection } from '@spec-writer/db';
import { z } from 'zod';

const CreateSectionSchema = z.object({
  code: z.string().min(1),
  title: z.string().min(1),
  sortOrder: z.number().int().min(0).optional(),
});

export async function GET() {
  try {
    const sections = await getSections();
    return NextResponse.json(sections);
  } catch {
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
    const section = await createSection(parsed.data);
    return NextResponse.json(section, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'Failed to create section', code: 'CREATE_ERROR' }, { status: 500 });
  }
}
