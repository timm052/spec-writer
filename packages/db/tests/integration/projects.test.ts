import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { eq } from 'drizzle-orm';
import { setupTestDb, teardownTestDb, type TestDb } from './helpers.js';
import { projects } from '../../src/schema/index.js';

let db: TestDb;
let ctx: Awaited<ReturnType<typeof setupTestDb>>;

beforeAll(async () => {
  ctx = await setupTestDb();
  db = ctx.db;
}, 120_000);

afterAll(async () => {
  await teardownTestDb(ctx);
});

describe('projects table', () => {
  it('inserts and retrieves a project by id', async () => {
    const [created] = await db
      .insert(projects)
      .values({ name: 'Integration Test Project', number: 'IT-001' })
      .returning();

    expect(created).toBeDefined();
    const id = created!.id;

    const [found] = await db.select().from(projects).where(eq(projects.id, id));
    expect(found?.name).toBe('Integration Test Project');
    expect(found?.number).toBe('IT-001');
    expect(found?.status).toBe('draft'); // default
  });

  it('stores and retrieves JSONB variables', async () => {
    const vars = { 'project.name': 'Test', 'project.client': 'ACME' };
    const [created] = await db
      .insert(projects)
      .values({ name: 'Var Project', variables: vars })
      .returning();

    const [found] = await db.select().from(projects).where(eq(projects.id, created!.id));
    expect(found?.variables).toEqual(vars);
  });

  it('updates project fields', async () => {
    const [created] = await db
      .insert(projects)
      .values({ name: 'Before Update' })
      .returning();

    await db
      .update(projects)
      .set({ name: 'After Update', status: 'in-review' })
      .where(eq(projects.id, created!.id));

    const [found] = await db.select().from(projects).where(eq(projects.id, created!.id));
    expect(found?.name).toBe('After Update');
    expect(found?.status).toBe('in-review');
  });

  it('deletes a project', async () => {
    const [created] = await db
      .insert(projects)
      .values({ name: 'To Delete' })
      .returning();

    await db.delete(projects).where(eq(projects.id, created!.id));

    const found = await db.select().from(projects).where(eq(projects.id, created!.id));
    expect(found).toHaveLength(0);
  });

  it('lists multiple projects', async () => {
    const beforeCount = (await db.select().from(projects)).length;

    await db.insert(projects).values([
      { name: 'Project Alpha' },
      { name: 'Project Beta' },
    ]);

    const all = await db.select().from(projects);
    expect(all.length).toBe(beforeCount + 2);
  });
});
