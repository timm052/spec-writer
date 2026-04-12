import { resolveClause } from '../resolver';

// Minimal shape of DB types needed by the engine
interface Clause {
  id: string;
  sectionId: string;
  code: string;
  title: string;
  body: string;
}

interface Section {
  id: string;
  code: string;
  title: string;
  sortOrder: number;
}

interface ProjectClause {
  id: string;
  clauseId: string;
  bodyOverride: string | null;
  sortOrder: number;
  included: boolean;
}

/**
 * A resolved project clause with all variables substituted and metadata
 */
export interface ResolvedClause {
  id: string;
  clauseId: string;
  code: string;
  title: string;
  body: string;
  sortOrder: number;
}

/**
 * A fully resolved project specification with sections and clauses
 */
export interface ResolvedSpec {
  projectId: string;
  sections: ResolvedSection[];
}

export interface ResolvedSection {
  id: string;
  code: string;
  title: string;
  clauses: ResolvedClause[];
}

export class SpecEngine {
  /**
   * Orders clauses within a section by sort_order
   */
  orderClausesBySection(clauses: ProjectClause[]): Map<string, ProjectClause[]> {
    const ordered = new Map<string, ProjectClause[]>();

    clauses.forEach((clause) => {
      const clauses = ordered.get(clause.clauseId) ?? [];
      clauses.push(clause);
      clauses.sort((a, b) => a.sortOrder - b.sortOrder);
      ordered.set(clause.clauseId, clauses);
    });

    return ordered;
  }

  /**
   * Filters included clauses (where included = true)
   */
  filterIncludedClauses(clauses: ProjectClause[]): ProjectClause[] {
    return clauses.filter((c) => c.included);
  }

  /**
   * Merges Drizzle clauses with project-specific overrides
   * Returns resolved spec with all variables substituted
   */
  mergeWithOverrides(
    projectClauses: ProjectClause[],
    baseClauses: Map<string, Clause>,
    sections: Map<string, Section>,
    projectVars: Record<string, string | undefined>,
    practiceVars: Record<string, string | undefined>
  ): ResolvedClause[] {

    return projectClauses
      .map((pc) => {
        const baseClause = baseClauses.get(pc.clauseId);
        if (!baseClause) {
          throw new Error(`Clause ${pc.clauseId} not found`);
        }

        // Use override body if provided, otherwise use base body
        const body = pc.bodyOverride ?? baseClause.body;

        // Resolve variables
        const resolvedBody = resolveClause(body, projectVars, practiceVars);

        return {
          id: pc.id,
          clauseId: pc.clauseId,
          code: baseClause.code,
          title: baseClause.title,
          body: resolvedBody,
          sortOrder: pc.sortOrder,
        };
      })
      .sort((a, b) => a.sortOrder - b.sortOrder);
  }

  /**
   * Builds a complete resolved specification for a project
   * Returns sections with properly ordered, resolved clauses
   */
  buildSpec(
    projectClauses: ProjectClause[],
    baseClauses: Clause[],
    sectionList: Section[],
    projectVars: Record<string, string | undefined>,
    practiceVars: Record<string, string | undefined>
  ): ResolvedSection[] {

    // Build maps for quick lookup
    const clauseMap = new Map(baseClauses.map((c) => [c.id, c]));
    const sectionMap = new Map(sectionList.map((s) => [s.id, s]));

    // Filter included clauses
    const included = this.filterIncludedClauses(projectClauses);

    // Group by section
    const clausesBySection = new Map<string, ResolvedClause[]>();

    included.forEach((pc) => {
      const baseClause = clauseMap.get(pc.clauseId);
      if (!baseClause) return;

      const section = sectionMap.get(baseClause.sectionId);
      if (!section) return;

      const body = pc.bodyOverride ?? baseClause.body;
      const resolvedBody = resolveClause(body, projectVars, practiceVars);

      const resolved: ResolvedClause = {
        id: pc.id,
        clauseId: pc.clauseId,
        code: baseClause.code,
        title: baseClause.title,
        body: resolvedBody,
        sortOrder: pc.sortOrder,
      };

      const clauses = clausesBySection.get(section.id) ?? [];
      clauses.push(resolved);
      clausesBySection.set(section.id, clauses);
    });

    // Build resolved sections, sorted by section order
    const resolvedSections = sectionList
      .sort((a, b) => a.sortOrder - b.sortOrder)
      .map((section) => ({
        id: section.id,
        code: section.code,
        title: section.title,
        clauses: (clausesBySection.get(section.id) ?? []).sort((a, b) => a.sortOrder - b.sortOrder),
      }));

    // Filter out sections with no clauses
    return resolvedSections.filter((s) => s.clauses.length > 0);
  }
}

export const specEngine = new SpecEngine();
