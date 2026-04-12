import { vi, describe, it, expect, beforeEach } from 'vitest';

vi.mock('@spec-writer/db', () => ({
  getProjectById: vi.fn(),
  getProjectSpec: vi.fn(),
}));

import { buildSpecSections } from '../../lib/build-spec-sections.js';
import { getProjectById, getProjectSpec } from '@spec-writer/db';

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const mockProject = {
  id: 'proj-1',
  name: 'Test Project',
  number: 'TP-001',
  client: 'ACME Corp',
  address: '123 Main St',
  variables: { 'project.name': 'Custom Name' } as Record<string, string>,
  status: 'active',
  createdAt: new Date(),
  updatedAt: new Date(),
};

const makeRow = (overrides: Record<string, unknown> = {}) => ({
  id: 'pc-1',
  clauseId: 'cl-1',
  included: true,
  bodyOverride: null,
  sortOrder: 0,
  status: 'draft',
  notes: null,
  clause: { id: 'cl-1', code: '01.01', title: 'Scope', body: 'All work for {{project.name}}.' },
  section: { id: 'sec-1', code: '01', title: 'General' },
  ...overrides,
});

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('buildSpecSections', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns null when project is not found', async () => {
    vi.mocked(getProjectById).mockResolvedValue(null);
    const result = await buildSpecSections('missing-id');
    expect(result).toBeNull();
  });

  it('returns a BuiltSpec object when project exists', async () => {
    vi.mocked(getProjectById).mockResolvedValue(mockProject as never);
    vi.mocked(getProjectSpec).mockResolvedValue([makeRow()] as never);
    const result = await buildSpecSections('proj-1');
    expect(result).not.toBeNull();
    expect(result).toHaveProperty('project');
    expect(result).toHaveProperty('sections');
  });

  it('maps project to ExportProject shape', async () => {
    vi.mocked(getProjectById).mockResolvedValue(mockProject as never);
    vi.mocked(getProjectSpec).mockResolvedValue([]);
    const result = await buildSpecSections('proj-1');
    expect(result!.project).toEqual({
      name: 'Test Project',
      number: 'TP-001',
      client: 'ACME Corp',
      address: '123 Main St',
    });
  });

  it('resolves variable tokens in clause body using project variables', async () => {
    vi.mocked(getProjectById).mockResolvedValue(mockProject as never);
    vi.mocked(getProjectSpec).mockResolvedValue([makeRow()] as never);
    const result = await buildSpecSections('proj-1');
    const clause = result!.sections[0]?.clauses[0];
    expect(clause?.resolvedBody).toBe('All work for Custom Name.');
  });

  it('uses bodyOverride instead of clause.body when present', async () => {
    vi.mocked(getProjectById).mockResolvedValue(mockProject as never);
    vi.mocked(getProjectSpec).mockResolvedValue([makeRow({ bodyOverride: 'Override text.' })] as never);
    const result = await buildSpecSections('proj-1');
    expect(result!.sections[0]?.clauses[0]?.resolvedBody).toBe('Override text.');
  });

  it('excludes clauses where included is false', async () => {
    vi.mocked(getProjectById).mockResolvedValue(mockProject as never);
    vi.mocked(getProjectSpec).mockResolvedValue([makeRow({ included: false })] as never);
    const result = await buildSpecSections('proj-1');
    expect(result!.sections).toHaveLength(0);
  });

  it('returns empty sections array for project with no clauses', async () => {
    vi.mocked(getProjectById).mockResolvedValue(mockProject as never);
    vi.mocked(getProjectSpec).mockResolvedValue([]);
    const result = await buildSpecSections('proj-1');
    expect(result!.sections).toHaveLength(0);
  });

  it('groups clauses from different sections into separate section entries', async () => {
    const rows = [
      makeRow(),
      makeRow({
        id: 'pc-2',
        clauseId: 'cl-2',
        sortOrder: 0,
        clause: { id: 'cl-2', code: '02.01', title: 'Materials', body: 'Material spec.' },
        section: { id: 'sec-2', code: '02', title: 'Materials' },
      }),
    ];
    vi.mocked(getProjectById).mockResolvedValue(mockProject as never);
    vi.mocked(getProjectSpec).mockResolvedValue(rows as never);
    const result = await buildSpecSections('proj-1');
    expect(result!.sections).toHaveLength(2);
  });

  it('groups multiple clauses from the same section together', async () => {
    const rows = [
      makeRow({ id: 'pc-1', clauseId: 'cl-1', sortOrder: 0 }),
      makeRow({
        id: 'pc-2',
        clauseId: 'cl-2',
        sortOrder: 1,
        clause: { id: 'cl-2', code: '01.02', title: 'Standards', body: 'Standards text.' },
      }),
    ];
    vi.mocked(getProjectById).mockResolvedValue(mockProject as never);
    vi.mocked(getProjectSpec).mockResolvedValue(rows as never);
    const result = await buildSpecSections('proj-1');
    expect(result!.sections).toHaveLength(1);
    expect(result!.sections[0]?.clauses).toHaveLength(2);
  });

  it('sorts clauses within a section by sortOrder ascending', async () => {
    const rows = [
      makeRow({ id: 'pc-1', clauseId: 'cl-1', sortOrder: 5, clause: { id: 'cl-1', code: '01.02', title: 'Second', body: 'B' } }),
      makeRow({ id: 'pc-2', clauseId: 'cl-2', sortOrder: 1, clause: { id: 'cl-2', code: '01.01', title: 'First', body: 'A' } }),
    ];
    vi.mocked(getProjectById).mockResolvedValue(mockProject as never);
    vi.mocked(getProjectSpec).mockResolvedValue(rows as never);
    const result = await buildSpecSections('proj-1');
    const clauses = result!.sections[0]?.clauses;
    expect(clauses![0]?.code).toBe('01.01');
    expect(clauses![1]?.code).toBe('01.02');
  });

  it('sorts sections by section code alphabetically', async () => {
    const rows = [
      makeRow({ section: { id: 'sec-2', code: '02', title: 'Concrete' }, clause: { id: 'cl-2', code: '02.01', title: 'Mix', body: 'Mix.' } }),
      makeRow({ id: 'pc-2', clauseId: 'cl-1', section: { id: 'sec-1', code: '01', title: 'General' } }),
    ];
    vi.mocked(getProjectById).mockResolvedValue(mockProject as never);
    vi.mocked(getProjectSpec).mockResolvedValue(rows as never);
    const result = await buildSpecSections('proj-1');
    expect(result!.sections[0]?.code).toBe('01');
    expect(result!.sections[1]?.code).toBe('02');
  });

  it('handles null project variables gracefully (falls back to empty object)', async () => {
    vi.mocked(getProjectById).mockResolvedValue({ ...mockProject, variables: null } as never);
    vi.mocked(getProjectSpec).mockResolvedValue([makeRow()] as never);
    const result = await buildSpecSections('proj-1');
    expect(result).not.toBeNull();
    // Token should be resolved with practice vars or left empty — should not throw
    expect(typeof result!.sections[0]?.clauses[0]?.resolvedBody).toBe('string');
  });
});
