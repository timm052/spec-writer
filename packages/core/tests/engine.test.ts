import { describe, it, expect, beforeEach } from 'vitest';
import { specEngine, ResolvedClause, ResolvedSection } from '../src';
import type { Clause, ProjectClause, Section } from '@spec-writer/db';

describe('SpecEngine', () => {
  let mockSections: Section[];
  let mockClauses: Clause[];
  let mockProjectClauses: ProjectClause[];

  beforeEach(() => {
    // Create mock sections
    mockSections = [
      {
        id: 'sec-01',
        code: '01',
        title: 'Preliminaries',
        parentId: null,
        sortOrder: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 'sec-02',
        code: '02',
        title: 'Site Works',
        parentId: null,
        sortOrder: 2,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    // Create mock clauses
    mockClauses = [
      {
        id: 'clause-01-01',
        sectionId: 'sec-01',
        code: '01.01',
        title: 'Contract conditions',
        body: 'Works for {{project.name}}',
        tags: ['preliminary'],
        source: 'natspec',
        version: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 'clause-01-02',
        sectionId: 'sec-01',
        code: '01.02',
        title: 'Site access',
        body: 'Site at {{site.address}}',
        tags: ['preliminary'],
        source: 'natspec',
        version: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 'clause-02-01',
        sectionId: 'sec-02',
        code: '02.01',
        title: 'Site preparation',
        body: 'Prepare {{site.address}} for {{project.name}}',
        tags: ['siteworks'],
        source: 'natspec',
        version: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    // Create mock project clauses
    mockProjectClauses = [
      {
        id: 'pc-01',
        projectId: 'proj-01',
        clauseId: 'clause-01-01',
        bodyOverride: null,
        sortOrder: 1,
        included: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 'pc-02',
        projectId: 'proj-01',
        clauseId: 'clause-01-02',
        bodyOverride: null,
        sortOrder: 2,
        included: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 'pc-03',
        projectId: 'proj-01',
        clauseId: 'clause-02-01',
        bodyOverride: 'Custom: Prepare {{site.address}}',
        sortOrder: 1,
        included: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];
  });

  describe('filterIncludedClauses', () => {
    it('should return only clauses where included = true', () => {
      const clauses = [
        ...mockProjectClauses,
        {
          id: 'pc-04',
          projectId: 'proj-01',
          clauseId: 'clause-01-01',
          bodyOverride: null,
          sortOrder: 3,
          included: false,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      const result = specEngine.filterIncludedClauses(clauses);

      expect(result).toHaveLength(3);
      expect(result.every((c) => c.included)).toBe(true);
    });

    it('should return empty array if all clauses are excluded', () => {
      const clauses = mockProjectClauses.map((c) => ({ ...c, included: false }));
      const result = specEngine.filterIncludedClauses(clauses);

      expect(result).toHaveLength(0);
    });
  });

  describe('mergeWithOverrides', () => {
    it('should use override body when provided', () => {
      const projectVars = { 'project.name': 'Sky Tower', 'site.address': '123 Main St' };
      const clauseMap = new Map(mockClauses.map((c) => [c.id, c]));

      const result = specEngine.mergeWithOverrides(mockProjectClauses, clauseMap, new Map(), projectVars, {});

      const overriddenClause = result.find((r) => r.clauseId === 'clause-02-01');
      expect(overriddenClause?.body).toBe('Custom: Prepare 123 Main St');
    });

    it('should use base body when no override exists', () => {
      const projectVars = { 'project.name': 'Sky Tower', 'site.address': '123 Main St' };
      const clauseMap = new Map(mockClauses.map((c) => [c.id, c]));

      const result = specEngine.mergeWithOverrides(mockProjectClauses, clauseMap, new Map(), projectVars, {});

      const baseClause = result.find((r) => r.clauseId === 'clause-01-01');
      expect(baseClause?.body).toBe('Works for Sky Tower');
    });

    it('should resolve variables from project vars', () => {
      const projectVars = { 'project.name': 'Sky Tower', 'site.address': '123 Main St' };
      const clauseMap = new Map(mockClauses.map((c) => [c.id, c]));

      const result = specEngine.mergeWithOverrides(mockProjectClauses, clauseMap, new Map(), projectVars, {});

      expect(result.find(r => r.clauseId === 'clause-01-02')?.body).toBe('Site at 123 Main St');
    });

    it('should sort by sortOrder', () => {
      const projectVars = { 'project.name': 'Sky Tower', 'site.address': '123 Main St' };
      const clauseMap = new Map(mockClauses.map((c) => [c.id, c]));

      const result = specEngine.mergeWithOverrides(mockProjectClauses, clauseMap, new Map(), projectVars, {});

      // Should be in order of sortOrder
      for (let i = 1; i < result.length; i++) {
        expect(result[i].sortOrder).toBeGreaterThanOrEqual(result[i - 1].sortOrder);
      }
    });
  });

  describe('buildSpec', () => {
    it('should build complete spec with sections and resolved clauses', () => {
      const projectVars = { 'project.name': 'Sky Tower', 'site.address': '123 Main St' };

      const result = specEngine.buildSpec(mockProjectClauses, mockClauses, mockSections, projectVars, {});

      expect(result).toHaveLength(2); // Two sections with clauses
      expect(result[0].id).toBe('sec-01');
      expect(result[0].clauses).toHaveLength(2);
      expect(result[1].id).toBe('sec-02');
      expect(result[1].clauses).toHaveLength(1);
    });

    it('should resolve variables in all clauses', () => {
      const projectVars = { 'project.name': 'Sky Tower', 'site.address': '123 Main St' };

      const result = specEngine.buildSpec(mockProjectClauses, mockClauses, mockSections, projectVars, {});

      result.forEach((section) => {
        section.clauses.forEach((clause) => {
          expect(clause.body).not.toContain('{{');
          expect(clause.body).not.toContain('}}');
        });
      });
    });

    it('should filter out sections with no included clauses', () => {
      const filtered = mockProjectClauses.map((c) => ({ ...c, included: false }));

      const result = specEngine.buildSpec(filtered, mockClauses, mockSections, {}, {});

      expect(result).toHaveLength(0);
    });

    it('should respect clause sort order within sections', () => {
      const projectVars = { 'project.name': 'Sky Tower', 'site.address': '123 Main St' };
      const reordered = [mockProjectClauses[0], { ...mockProjectClauses[1], sortOrder: 0 }, mockProjectClauses[2]];

      const result = specEngine.buildSpec(reordered, mockClauses, mockSections, projectVars, {});

      // Second clause (01.02) should have sortOrder 0, so should come first in section 01
      expect(result[0].clauses[0].code).toBe('01.02');
      expect(result[0].clauses[1].code).toBe('01.01');
    });

    it('should apply body overrides', () => {
      const projectVars = { 'project.name': 'Sky Tower', 'site.address': '123 Main St' };

      const result = specEngine.buildSpec(mockProjectClauses, mockClauses, mockSections, projectVars, {});

      const overriddenSection = result.find((s) => s.id === 'sec-02');
      const overriddenClause = overriddenSection?.clauses[0];

      expect(overriddenClause?.body).toContain('Custom:');
    });

    it('should use practice vars as fallback', () => {
      const projectVars: Record<string, string | undefined> = {};
      const practiceVars = { 'project.name': 'Default Project', 'site.address': 'HQ' };

      const result = specEngine.buildSpec(mockProjectClauses, mockClauses, mockSections, projectVars, practiceVars);

      expect(result[0].clauses[0].body).toBe('Works for Default Project');
      expect(result[0].clauses[1].body).toBe('Site at HQ');
    });

    it('should return empty array for empty project clauses', () => {
      const result = specEngine.buildSpec([], mockClauses, mockSections, {}, {});
      expect(result).toHaveLength(0);
    });

    it('should return empty array for empty sections list', () => {
      const result = specEngine.buildSpec(mockProjectClauses, mockClauses, [], {}, {});
      expect(result).toHaveLength(0);
    });

    it('should produce a single-section spec when clauses span only one section', () => {
      const singleSectionClauses = mockProjectClauses.filter((pc) =>
        mockClauses.find((c) => c.id === pc.clauseId)?.sectionId === 'sec-01'
      );
      const projectVars = { 'project.name': 'Sky Tower', 'site.address': '123 Main St' };

      const result = specEngine.buildSpec(singleSectionClauses, mockClauses, mockSections, projectVars, {});

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('sec-01');
    });

    it('should sort sections by sortOrder', () => {
      const reversedSections = [...mockSections].reverse(); // sec-02 first
      const projectVars = { 'project.name': 'Sky Tower', 'site.address': '123 Main St' };

      const result = specEngine.buildSpec(mockProjectClauses, mockClauses, reversedSections, projectVars, {});

      expect(result[0].code).toBe('01');
      expect(result[1].code).toBe('02');
    });

    it('should leave unresolved tokens empty when no vars provided', () => {
      const result = specEngine.buildSpec(mockProjectClauses, mockClauses, mockSections, {}, {});

      // All tokens should be replaced with empty string (no raw {{ }} left)
      result.forEach((section) => {
        section.clauses.forEach((clause) => {
          expect(clause.body).not.toContain('{{');
          expect(clause.body).not.toContain('}}');
        });
      });
    });
  });
});
