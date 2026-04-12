import { eq, asc, and, max } from 'drizzle-orm';
import { db, projectClauses, clauses, sections, projectIssues, projectSections } from '../index.js';


interface AddClauseToProjectInput {
  clauseId: string;
  sortOrder?: number;
}

interface UpdateProjectClauseInput {
  bodyOverride?: string | null;
  sortOrder?: number;
  included?: boolean;
  status?: 'draft' | 'reviewed' | 'approved';
  notes?: string | null;
}

export async function getProjectSpec(projectId: string) {
  return db
    .select({
      id: projectClauses.id,
      projectId: projectClauses.projectId,
      clauseId: projectClauses.clauseId,
      bodyOverride: projectClauses.bodyOverride,
      sortOrder: projectClauses.sortOrder,
      included: projectClauses.included,
      status: projectClauses.status,
      notes: projectClauses.notes,
      clause: {
        id: clauses.id,
        code: clauses.code,
        title: clauses.title,
        body: clauses.body,
        tags: clauses.tags,
        source: clauses.source,
      },
      section: {
        id: sections.id,
        code: sections.code,
        title: sections.title,
      },
      projectSectionSortOrder: projectSections.sortOrder,
    })
    .from(projectClauses)
    .innerJoin(clauses, eq(projectClauses.clauseId, clauses.id))
    .innerJoin(sections, eq(clauses.sectionId, sections.id))
    .leftJoin(
      projectSections,
      and(
        eq(projectSections.projectId, projectClauses.projectId),
        eq(projectSections.sectionId, sections.id),
      ),
    )
    .where(eq(projectClauses.projectId, projectId))
    .orderBy(asc(projectClauses.sortOrder));
}

export async function addClauseToProject(projectId: string, input: AddClauseToProjectInput) {
  // Check if this clause already exists in the project (included or not)
  const [existing] = await db
    .select()
    .from(projectClauses)
    .where(and(eq(projectClauses.projectId, projectId), eq(projectClauses.clauseId, input.clauseId)))
    .limit(1);

  if (existing) {
    if (existing.included) {
      return existing; // Already active — return it as-is
    }
    // Previously removed — re-enable it instead of creating a duplicate
    const [updated] = await db
      .update(projectClauses)
      .set({ included: true })
      .where(eq(projectClauses.id, existing.id))
      .returning();
    if (!updated) throw new Error('Failed to re-enable clause');
    return updated;
  }

  // Auto-assign sortOrder if not provided
  let sortOrder = input.sortOrder;
  if (sortOrder === undefined) {
    const rows = await db
      .select({ sortOrder: projectClauses.sortOrder })
      .from(projectClauses)
      .where(eq(projectClauses.projectId, projectId))
      .orderBy(asc(projectClauses.sortOrder));
    const last = rows[rows.length - 1];
    sortOrder = last ? last.sortOrder + 1 : 0;
  }

  const pcRows = await db
    .insert(projectClauses)
    .values({ projectId, clauseId: input.clauseId, sortOrder })
    .returning();
  const row = pcRows[0];
  if (!row) throw new Error('Failed to add clause to project');

  // Ensure the clause's section has a project_sections entry for this project
  const [clause] = await db
    .select({ sectionId: clauses.sectionId })
    .from(clauses)
    .where(eq(clauses.id, input.clauseId))
    .limit(1);

  if (clause) {
    const [existingSection] = await db
      .select()
      .from(projectSections)
      .where(and(eq(projectSections.projectId, projectId), eq(projectSections.sectionId, clause.sectionId)))
      .limit(1);

    if (!existingSection) {
      const [maxRow] = await db
        .select({ maxOrder: max(projectSections.sortOrder) })
        .from(projectSections)
        .where(eq(projectSections.projectId, projectId));
      const nextSectionOrder = maxRow?.maxOrder != null ? maxRow.maxOrder + 1 : 0;
      await db
        .insert(projectSections)
        .values({ projectId, sectionId: clause.sectionId, sortOrder: nextSectionOrder })
        .onConflictDoNothing();
    }
  }

  return row;
}

export async function updateProjectClause(
  _projectId: string,
  clauseId: string,
  input: UpdateProjectClauseInput,
) {
  const rows = await db
    .update(projectClauses)
    .set({
      ...(input.bodyOverride !== undefined && { bodyOverride: input.bodyOverride }),
      ...(input.sortOrder !== undefined && { sortOrder: input.sortOrder }),
      ...(input.included !== undefined && { included: input.included }),
      ...(input.status !== undefined && { status: input.status }),
      ...(input.notes !== undefined && { notes: input.notes }),
    })
    .where(eq(projectClauses.id, clauseId))
    .returning();
  const row = rows[0];
  if (!row) throw new Error(`Project clause ${clauseId} not found`);
  return row;
}

export async function updateProjectSectionOrder(
  projectId: string,
  sectionId: string,
  sortOrder: number,
) {
  const [row] = await db
    .update(projectSections)
    .set({ sortOrder })
    .where(and(eq(projectSections.projectId, projectId), eq(projectSections.sectionId, sectionId)))
    .returning();
  if (!row) throw new Error(`project_sections entry not found for project ${projectId} section ${sectionId}`);
  return row;
}

export async function removeProjectClause(projectClauseId: string) {
  await db.delete(projectClauses).where(eq(projectClauses.id, projectClauseId));
}

export async function resetAllOverrides(projectId: string) {
  await db
    .update(projectClauses)
    .set({ bodyOverride: null })
    .where(and(eq(projectClauses.projectId, projectId), eq(projectClauses.included, true)));
}

// ─── Issue register ───────────────────────────────────────────────────────────

export async function getProjectIssues(projectId: string) {
  return db
    .select()
    .from(projectIssues)
    .where(eq(projectIssues.projectId, projectId))
    .orderBy(asc(projectIssues.issuedAt));
}

export async function createProjectIssue(
  projectId: string,
  input: { revision: string; description: string; issuedAt?: Date },
) {
  const [row] = await db
    .insert(projectIssues)
    .values({
      projectId,
      revision: input.revision,
      description: input.description,
      issuedAt: input.issuedAt ?? new Date(),
    })
    .returning();
  if (!row) throw new Error('Failed to create project issue');
  return row;
}

export async function deleteProjectIssue(issueId: string) {
  await db.delete(projectIssues).where(eq(projectIssues.id, issueId));
}

