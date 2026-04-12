import { NextResponse } from 'next/server';
import { createSection, createClause, getSections } from '@spec-writer/db';
import { z } from 'zod';

// Import format: array of sections, each containing clauses
const ImportClauseSchema = z.object({
  code: z.string().min(1),
  title: z.string().min(1),
  body: z.string().default(''),
  tags: z.array(z.string()).optional(),
  source: z.enum(['natspec', 'practice', 'project']).optional(),
});

const ImportSectionSchema = z.object({
  code: z.string().min(1),
  title: z.string().min(1),
  clauses: z.array(ImportClauseSchema).optional().default([]),
});

const ImportSchema = z.array(ImportSectionSchema);

export async function POST(request: Request) {
  try {
    const body: unknown = await request.json();
    const parsed = ImportSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? 'Invalid import format', code: 'VALIDATION_ERROR' },
        { status: 400 },
      );
    }

    const existingSections = await getSections();
    const sectionByCode = new Map(existingSections.map((s) => [s.code.toLowerCase(), s]));

    let sectionsCreated = 0;
    let clausesCreated = 0;

    for (const sectionInput of parsed.data) {
      // Reuse existing section if code matches, otherwise create
      let section = sectionByCode.get(sectionInput.code.toLowerCase());
      if (!section) {
        section = await createSection({ code: sectionInput.code, title: sectionInput.title });
        sectionByCode.set(sectionInput.code.toLowerCase(), section);
        sectionsCreated++;
      }

      for (const clauseInput of sectionInput.clauses) {
        await createClause({
          sectionId: section.id,
          code: clauseInput.code,
          title: clauseInput.title,
          body: clauseInput.body,
          tags: clauseInput.tags,
          source: clauseInput.source ?? 'practice',
        });
        clausesCreated++;
      }
    }

    return NextResponse.json({ sectionsCreated, clausesCreated }, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'Import failed', code: 'IMPORT_ERROR' }, { status: 500 });
  }
}
