/**
 * Integration tests for the project spec (projectClauses) query logic.
 * These tests verify the joins and ordering that getProjectSpec relies on.
 */
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { eq, asc, and } from 'drizzle-orm';
import { setupTestDb, teardownTestDb, type TestDb } from './helpers.js';
import { projects, sections, clauses, projectClauses } from '../../src/schema/index.js';

let db: TestDb;
let ctx: Awaited<ReturnType<typeof setupTestDb>>;

// Shared fixtures — created once, used by all tests
let projectId: string;
let sectionId: string;
let clauseId1: string;
let clauseId2: string;

beforeAll(async () => {
  ctx = await setupTestDb();
  db = ctx.db;

  // Seed a project, section, and two clauses
  const [proj] = await db.insert(projects).values({ name: 'Spec Test Project', number: 'SP-001' }).returning();
  projectId = proj!.id;

  const [sec] = await db.insert(sections).values({ code: '01', title: 'General', sortOrder: 0 }).returning();
  sectionId = sec!.id;

  const [c1] = await db.insert(clauses).values({ sectionId, code: '01.01', title: 'Scope', body: 'Scope body.' }).returning();
  const [c2] = await db.insert(clauses).values({ sectionId, code: '01.02', title: 'Standards', body: 'Standards body.' }).returning();
  clauseId1 = c1!.id;
  clauseId2 = c2!.id;
}, 120_000);

afterAll(async () => {
  await teardownTestDb(ctx);
});

describe('projectClauses → spec join', () => {
  it('addClauseToProject: join returns clause and section data', async () => {
    await db.insert(projectClauses).values({ projectId, clauseId: clauseId1, sortOrder: 0 });

    const rows = await db
      .select({
        id: projectClauses.id,
        sortOrder: projectClauses.sortOrder,
        included: projectClauses.included,
        bodyOverride: projectClauses.bodyOverride,
        clause: { id: clauses.id, code: clauses.code, title: clauses.title, body: clauses.body },
        section: { id: sections.id, code: sections.code, title: sections.title },
      })
      .from(projectClauses)
      .innerJoin(clauses, eq(projectClauses.clauseId, clauses.id))
      .innerJoin(sections, eq(clauses.sectionId, sections.id))
      .where(eq(projectClauses.projectId, projectId))
      .orderBy(asc(projectClauses.sortOrder));

    expect(rows).toHaveLength(1);
    expect(rows[0]?.clause.code).toBe('01.01');
    expect(rows[0]?.clause.title).toBe('Scope');
    expect(rows[0]?.section.code).toBe('01');
    expect(rows[0]?.included).toBe(true);
    expect(rows[0]?.bodyOverride).toBeNull();
  });

  it('sortOrder is preserved and rows returned in correct order', async () => {
    // Add second clause with higher sort order
    await db.insert(projectClauses).values({ projectId, clauseId: clauseId2, sortOrder: 1 });

    const rows = await db
      .select({ sortOrder: projectClauses.sortOrder, code: clauses.code })
      .from(projectClauses)
      .innerJoin(clauses, eq(projectClauses.clauseId, clauses.id))
      .where(eq(projectClauses.projectId, projectId))
      .orderBy(asc(projectClauses.sortOrder));

    expect(rows[0]?.sortOrder).toBe(0);
    expect(rows[0]?.code).toBe('01.01');
    expect(rows[1]?.sortOrder).toBe(1);
    expect(rows[1]?.code).toBe('01.02');
  });

  it('bodyOverride persists and is returned in the spec query', async () => {
    const [pc] = await db
      .select()
      .from(projectClauses)
      .where(and(eq(projectClauses.projectId, projectId), eq(projectClauses.clauseId, clauseId1)));

    await db
      .update(projectClauses)
      .set({ bodyOverride: '<p>Custom override text.</p>' })
      .where(eq(projectClauses.id, pc!.id));

    const [updated] = await db
      .select({ bodyOverride: projectClauses.bodyOverride })
      .from(projectClauses)
      .where(eq(projectClauses.id, pc!.id));

    expect(updated?.bodyOverride).toBe('<p>Custom override text.</p>');
  });

  it('setting included=false excludes clause from active spec', async () => {
    const [pc] = await db
      .select()
      .from(projectClauses)
      .where(and(eq(projectClauses.projectId, projectId), eq(projectClauses.clauseId, clauseId1)));

    await db
      .update(projectClauses)
      .set({ included: false })
      .where(eq(projectClauses.id, pc!.id));

    const activeRows = await db
      .select()
      .from(projectClauses)
      .where(and(eq(projectClauses.projectId, projectId), eq(projectClauses.included, true)));

    const ids = activeRows.map((r) => r.clauseId);
    expect(ids).not.toContain(clauseId1);
    expect(ids).toContain(clauseId2);
  });
});

describe('cascade delete', () => {
  it('deleting a project removes all its projectClauses rows', async () => {
    // Create a fresh project with clauses
    const [proj] = await db.insert(projects).values({ name: 'Cascade Test' }).returning();
    const pid = proj!.id;

    await db.insert(projectClauses).values([
      { projectId: pid, clauseId: clauseId1, sortOrder: 0 },
      { projectId: pid, clauseId: clauseId2, sortOrder: 1 },
    ]);

    const beforeDelete = await db.select().from(projectClauses).where(eq(projectClauses.projectId, pid));
    expect(beforeDelete).toHaveLength(2);

    await db.delete(projects).where(eq(projects.id, pid));

    const afterDelete = await db.select().from(projectClauses).where(eq(projectClauses.projectId, pid));
    expect(afterDelete).toHaveLength(0);
  });
});
