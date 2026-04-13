import { NextResponse } from 'next/server';
import { createSection, createClause, getSections, getDefaultClauseSet } from '@spec-writer/db';
import { z } from 'zod';

const ImportBodySchema = z.object({
  clauseSetId: z.string().uuid().optional(),
  sections: z.array(z.object({
    code: z.string().min(1),
    title: z.string().min(1),
    clauses: z.array(z.object({
      code: z.string().min(1),
      title: z.string().min(1),
      body: z.string().default(''),
      tags: z.array(z.string()).optional(),
      source: z.enum(['natspec', 'practice', 'project']).optional(),
    })).optional().default([]),
  })),
});

// Legacy format: bare array of sections (no clauseSetId wrapper)
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
    const rawBody: unknown = await request.json();

    // Support both { clauseSetId, sections: [...] } and legacy bare array
    let clauseSetId: string | undefined;
    let sectionsData: z.infer<typeof ImportSchema>;

    if (Array.isArray(rawBody)) {
      const parsed = ImportSchema.safeParse(rawBody);
      if (!parsed.success) {
        return NextResponse.json(
          { error: parsed.error.issues[0]?.message ?? 'Invalid import format', code: 'VALIDATION_ERROR' },
          { status: 400 },
        );
      }
      sectionsData = parsed.data;
    } else {
      const parsed = ImportBodySchema.safeParse(rawBody);
      if (!parsed.success) {
        return NextResponse.json(
          { error: parsed.error.issues[0]?.message ?? 'Invalid import format', code: 'VALIDATION_ERROR' },
          { status: 400 },
        );
      }
      clauseSetId = parsed.data.clauseSetId;
      sectionsData = parsed.data.sections;
    }

    // Resolve target clause set
    if (!clauseSetId) {
      const defaultSet = await getDefaultClauseSet();
      if (!defaultSet) {
        return NextResponse.json({ error: 'No clause set found', code: 'NOT_FOUND' }, { status: 404 });
      }
      clauseSetId = defaultSet.id;
    }

    const existingSections = await getSections(clauseSetId);
    const sectionByCode = new Map(existingSections.map((s) => [s.code.toLowerCase(), s]));

    let sectionsCreated = 0;
    let clausesCreated = 0;

    for (const sectionInput of sectionsData) {
      // Reuse existing section if code matches, otherwise create
      let section = sectionByCode.get(sectionInput.code.toLowerCase());
      if (!section) {
        section = await createSection({ clauseSetId: clauseSetId!, code: sectionInput.code, title: sectionInput.title });
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
