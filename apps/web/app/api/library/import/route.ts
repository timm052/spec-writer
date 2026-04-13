import { NextResponse } from 'next/server';
import { getDefaultClauseSet, createSection, createClause } from '@spec-writer/db';
import { z } from 'zod';

const ClauseImportSchema = z.object({
  code: z.string().min(1),
  title: z.string().min(1),
  body: z.string().default(''),
  tags: z.array(z.string()).optional(),
});

const SectionImportSchema = z.object({
  code: z.string().min(1),
  title: z.string().min(1),
  clauses: z.array(ClauseImportSchema).optional().default([]),
});

// Preferred shape: { clauseSetId?, sections: [...] }
const ImportBodySchema = z.object({
  clauseSetId: z.string().uuid().optional(),
  sections: z.array(SectionImportSchema),
});

export async function POST(request: Request) {
  try {
    const raw: unknown = await request.json();

    // Accept either { clauseSetId?, sections: [...] } or a bare array (legacy)
    const normalized = Array.isArray(raw) ? { sections: raw } : raw;

    const parsed = ImportBodySchema.safeParse(normalized);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? 'Invalid input', code: 'VALIDATION_ERROR' },
        { status: 400 },
      );
    }

    let resolvedSetId = parsed.data.clauseSetId;
    if (!resolvedSetId) {
      const defaultSet = await getDefaultClauseSet();
      if (!defaultSet) {
        return NextResponse.json(
          { error: 'No clause sets exist — create one first', code: 'NO_CLAUSE_SET' },
          { status: 400 },
        );
      }
      resolvedSetId = defaultSet.id;
    }

    let sectionsCreated = 0;
    let clausesCreated = 0;

    for (const sectionData of parsed.data.sections) {
      const section = await createSection({
        clauseSetId: resolvedSetId,
        code: sectionData.code,
        title: sectionData.title,
      });
      sectionsCreated++;

      for (const clauseData of sectionData.clauses) {
        await createClause({
          sectionId: section.id,
          code: clauseData.code,
          title: clauseData.title,
          body: clauseData.body,
          tags: clauseData.tags,
        });
        clausesCreated++;
      }
    }

    return NextResponse.json({ sectionsCreated, clausesCreated });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Import failed', code: 'IMPORT_ERROR' }, { status: 500 });
  }
}
