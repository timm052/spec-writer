import { eq, sql, and } from 'drizzle-orm';
import { db, projects, projectClauses } from '../index.js';

interface CreateProjectInput {
  name: string;
  number?: string;
  client?: string;
  address?: string;
  variables?: Record<string, string>;
}

interface UpdateProjectInput {
  name?: string;
  number?: string;
  client?: string;
  address?: string;
  variables?: Record<string, string>;
  status?: 'draft' | 'in-review' | 'issued';
  clauseSetId?: string | null;
}

export async function getProjects() {
  return db.select().from(projects).orderBy(projects.createdAt);
}

export async function getProjectsWithClauseCounts() {
  return db
    .select({
      id: projects.id,
      name: projects.name,
      number: projects.number,
      client: projects.client,
      address: projects.address,
      variables: projects.variables,
      status: projects.status,
      clauseSetId: projects.clauseSetId,
      createdAt: projects.createdAt,
      updatedAt: projects.updatedAt,
      clauseCount: sql<number>`cast(count(case when ${projectClauses.included} = true then 1 end) as int)`,
    })
    .from(projects)
    .leftJoin(projectClauses, eq(projects.id, projectClauses.projectId))
    .groupBy(projects.id)
    .orderBy(projects.createdAt);
}

export async function duplicateProject(sourceId: string) {
  const source = await getProjectById(sourceId);
  if (!source) throw new Error('Project not found');

  const [newProject] = await db
    .insert(projects)
    .values({
      name: `${source.name} (Copy)`,
      number: source.number ?? undefined,
      client: source.client ?? undefined,
      address: source.address ?? undefined,
      variables: source.variables ?? {},
    })
    .returning();
  if (!newProject) throw new Error('Failed to duplicate project');

  const sourceClauses = await db
    .select()
    .from(projectClauses)
    .where(and(eq(projectClauses.projectId, sourceId), eq(projectClauses.included, true)));

  if (sourceClauses.length > 0) {
    await db.insert(projectClauses).values(
      sourceClauses.map((c) => ({
        projectId: newProject.id,
        clauseId: c.clauseId,
        bodyOverride: c.bodyOverride,
        sortOrder: c.sortOrder,
        included: true as const,
      })),
    );
  }

  return newProject;
}

export async function getProjectById(id: string) {
  const rows = await db.select().from(projects).where(eq(projects.id, id)).limit(1);
  return rows[0] ?? null;
}

export async function createProject(input: CreateProjectInput) {
  const rows = await db
    .insert(projects)
    .values({
      name: input.name,
      number: input.number,
      client: input.client,
      address: input.address,
      variables: input.variables ?? {},
    })
    .returning();
  const project = rows[0];
  if (!project) throw new Error('Failed to create project');
  return project;
}

export async function updateProject(id: string, input: UpdateProjectInput) {
  const rows = await db
    .update(projects)
    .set({
      ...(input.name !== undefined && { name: input.name }),
      ...(input.number !== undefined && { number: input.number }),
      ...(input.client !== undefined && { client: input.client }),
      ...(input.address !== undefined && { address: input.address }),
      ...(input.variables !== undefined && { variables: input.variables }),
      ...(input.status !== undefined && { status: input.status }),
      ...(input.clauseSetId !== undefined && { clauseSetId: input.clauseSetId }),
    })
    .where(eq(projects.id, id))
    .returning();
  const project = rows[0];
  if (!project) throw new Error(`Project ${id} not found`);
  return project;
}

export async function deleteProject(id: string) {
  await db.delete(projects).where(eq(projects.id, id));
}
