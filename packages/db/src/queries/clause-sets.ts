import { eq, asc } from 'drizzle-orm';
import { db, clauseSets } from '../index.js';

export async function getClauseSets() {
  return db.select().from(clauseSets).orderBy(asc(clauseSets.createdAt));
}

export async function getClauseSetById(id: string) {
  const rows = await db.select().from(clauseSets).where(eq(clauseSets.id, id)).limit(1);
  return rows[0] ?? null;
}

export async function getDefaultClauseSet() {
  const rows = await db
    .select()
    .from(clauseSets)
    .orderBy(asc(clauseSets.createdAt))
    .limit(1);
  return rows[0] ?? null;
}

export async function createClauseSet(input: { name: string; description?: string }) {
  const [row] = await db
    .insert(clauseSets)
    .values({ name: input.name, description: input.description })
    .returning();
  if (!row) throw new Error('Failed to create clause set');
  return row;
}

export async function updateClauseSet(id: string, input: { name?: string; description?: string }) {
  const [row] = await db
    .update(clauseSets)
    .set({
      ...(input.name !== undefined && { name: input.name }),
      ...(input.description !== undefined && { description: input.description }),
    })
    .where(eq(clauseSets.id, id))
    .returning();
  if (!row) throw new Error(`Clause set ${id} not found`);
  return row;
}

export async function deleteClauseSet(id: string) {
  await db.delete(clauseSets).where(eq(clauseSets.id, id));
}
