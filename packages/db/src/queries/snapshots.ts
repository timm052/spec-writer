import { eq, asc, max } from 'drizzle-orm';
import { db, specSnapshots } from '../index.js';

export async function createSnapshot(
  projectId: string,
  snapshotJson: Record<string, unknown>,
  label?: string,
) {
  // Auto-increment version per project
  const [maxRow] = await db
    .select({ maxVersion: max(specSnapshots.version) })
    .from(specSnapshots)
    .where(eq(specSnapshots.projectId, projectId));
  const nextVersion = (maxRow?.maxVersion ?? 0) + 1;

  const [row] = await db
    .insert(specSnapshots)
    .values({
      projectId,
      version: nextVersion,
      label: label ?? null,
      snapshotJson,
    })
    .returning();
  if (!row) throw new Error('Failed to create snapshot');
  return row;
}

export async function getSnapshots(projectId: string) {
  return db
    .select({
      id: specSnapshots.id,
      version: specSnapshots.version,
      label: specSnapshots.label,
      createdAt: specSnapshots.createdAt,
    })
    .from(specSnapshots)
    .where(eq(specSnapshots.projectId, projectId))
    .orderBy(asc(specSnapshots.version));
}

export async function getSnapshotById(snapshotId: string) {
  const [row] = await db
    .select()
    .from(specSnapshots)
    .where(eq(specSnapshots.id, snapshotId))
    .limit(1);
  return row ?? null;
}
