import { eq, ilike, or, sql, asc } from 'drizzle-orm';
import { db, sections, clauses } from '../index.js';

// ─── Sections ─────────────────────────────────────────────────────────────────

export async function createSection(input: { code: string; title: string; sortOrder?: number }) {
  const allSections = await db.select({ sortOrder: sections.sortOrder }).from(sections).orderBy(asc(sections.sortOrder));
  const maxSort = allSections[allSections.length - 1]?.sortOrder ?? -1;
  const [row] = await db
    .insert(sections)
    .values({ code: input.code, title: input.title, sortOrder: input.sortOrder ?? maxSort + 1 })
    .returning();
  if (!row) throw new Error('Failed to create section');
  return row;
}

export async function updateSection(id: string, input: { code?: string; title?: string }) {
  const [row] = await db
    .update(sections)
    .set({
      ...(input.code !== undefined && { code: input.code }),
      ...(input.title !== undefined && { title: input.title }),
    })
    .where(eq(sections.id, id))
    .returning();
  if (!row) throw new Error(`Section ${id} not found`);
  return row;
}

export async function deleteSection(id: string) {
  await db.delete(sections).where(eq(sections.id, id));
}

// ─── Clauses ──────────────────────────────────────────────────────────────────

interface CreateClauseInput {
  sectionId: string;
  code: string;
  title: string;
  body: string;
  tags?: string[];
  source?: 'natspec' | 'practice' | 'project';
}

interface UpdateClauseInput {
  sectionId?: string;
  code?: string;
  title?: string;
  body?: string;
  tags?: string[];
  source?: 'natspec' | 'practice' | 'project';
}

export async function createClause(input: CreateClauseInput) {
  const [row] = await db
    .insert(clauses)
    .values({
      sectionId: input.sectionId,
      code: input.code,
      title: input.title,
      body: input.body,
      tags: input.tags ?? [],
      source: input.source ?? 'practice',
    })
    .returning();
  if (!row) throw new Error('Failed to create clause');
  return row;
}

export async function updateClause(id: string, input: UpdateClauseInput) {
  const [row] = await db
    .update(clauses)
    .set({
      ...(input.sectionId !== undefined && { sectionId: input.sectionId }),
      ...(input.code !== undefined && { code: input.code }),
      ...(input.title !== undefined && { title: input.title }),
      ...(input.body !== undefined && { body: input.body }),
      ...(input.tags !== undefined && { tags: input.tags }),
      ...(input.source !== undefined && { source: input.source }),
    })
    .where(eq(clauses.id, id))
    .returning();
  if (!row) throw new Error(`Clause ${id} not found`);
  return row;
}

export async function deleteClause(id: string) {
  await db.delete(clauses).where(eq(clauses.id, id));
}

interface SearchClausesInput {
  q?: string;
  section?: string;
  tags?: string;
}

export async function getSections() {
  return db.select().from(sections).orderBy(sections.sortOrder);
}

export async function getAllTags(): Promise<string[]> {
  const result = await db.execute(
    sql`SELECT DISTINCT jsonb_array_elements_text(tags) AS tag FROM clauses WHERE tags IS NOT NULL AND jsonb_array_length(tags) > 0 ORDER BY tag`,
  );
  return (result.rows as Array<{ tag: string }>).map((r) => r.tag);
}

export async function getClauseById(id: string) {
  const rows = await db.select().from(clauses).where(eq(clauses.id, id)).limit(1);
  return rows[0] ?? null;
}

export async function searchClauses(input: SearchClausesInput) {
  const conditions = [];

  if (input.section) {
    conditions.push(eq(clauses.sectionId, input.section));
  }

  if (input.q) {
    const term = `%${input.q}%`;
    conditions.push(
      or(
        ilike(clauses.title, term),
        ilike(clauses.body, term),
        ilike(clauses.code, term),
      ),
    );
  }

  if (input.tags) {
    const tagList = input.tags.split(',').map((t: string) => t.trim());
    conditions.push(
      sql`${clauses.tags} ?| array[${sql.join(
        tagList.map((t: string) => sql`${t}`),
        sql`, `,
      )}]`,
    );
  }

  const query = db
    .select({
      id: clauses.id,
      sectionId: clauses.sectionId,
      code: clauses.code,
      title: clauses.title,
      body: clauses.body,
      tags: clauses.tags,
      source: clauses.source,
      version: clauses.version,
      createdAt: clauses.createdAt,
      updatedAt: clauses.updatedAt,
      sectionTitle: sections.title,
      sectionCode: sections.code,
    })
    .from(clauses)
    .innerJoin(sections, eq(clauses.sectionId, sections.id));

  if (conditions.length === 0) {
    return query.orderBy(clauses.code);
  }

  if (conditions.length === 1) {
    return query.where(conditions[0]!).orderBy(clauses.code);
  }

  // Multiple conditions: combine with AND
  const [first, ...rest] = conditions;
  let combined = first!;
  for (const cond of rest) {
    combined = sql`${combined} AND ${cond}`;
  }
  return query.where(combined).orderBy(clauses.code);
}
