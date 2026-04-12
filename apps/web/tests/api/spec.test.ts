import { vi, describe, it, expect, beforeEach } from 'vitest';

vi.mock('@spec-writer/db', () => ({
  getProjectById: vi.fn(),
  getProjectSpec: vi.fn(),
}));

vi.mock('next/server', () => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const NextResponse: any = function (body: BodyInit | null, init?: ResponseInit) {
    return new Response(body, init);
  };
  NextResponse.json = (data: unknown, init?: ResponseInit) =>
    new Response(JSON.stringify(data), {
      status: init?.status ?? 200,
      headers: new Headers({ 'content-type': 'application/json' }),
    });
  return { NextResponse };
});

import { GET } from '../../app/api/projects/[id]/spec/route.js';
import { getProjectById, getProjectSpec } from '@spec-writer/db';

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const mockProject = {
  id: 'proj-1',
  name: 'Test Project',
  number: 'TP-001',
  client: 'ACME',
  address: '1 Main St',
  variables: { 'project.name': 'Test Project' } as Record<string, string>,
  status: 'active',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

const mockSpecRow = {
  id: 'pc-1',
  clauseId: 'cl-1',
  included: true,
  bodyOverride: null,
  sortOrder: 0,
  status: 'draft',
  notes: null,
  clause: { id: 'cl-1', code: '01.01', title: 'Scope', body: 'Scope text.' },
  section: { id: 'sec-1', code: '01', title: 'General' },
};

const ctx = (id: string) => ({ params: Promise.resolve({ id }) });

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('GET /api/projects/[id]/spec', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns 200 with project and sections', async () => {
    vi.mocked(getProjectById).mockResolvedValue(mockProject as never);
    vi.mocked(getProjectSpec).mockResolvedValue([mockSpecRow] as never);
    const response = await GET(new Request('http://localhost'), ctx('proj-1'));
    expect(response.status).toBe(200);
    const data = await response.json() as { project: unknown; sections: unknown[] };
    expect(data).toHaveProperty('project');
    expect(data).toHaveProperty('sections');
  });

  it('returns 404 with NOT_FOUND when project does not exist', async () => {
    vi.mocked(getProjectById).mockResolvedValue(null);
    const response = await GET(new Request('http://localhost'), ctx('missing'));
    expect(response.status).toBe(404);
    const data = await response.json() as { code: string };
    expect(data.code).toBe('NOT_FOUND');
  });

  it('groups clauses by section', async () => {
    vi.mocked(getProjectById).mockResolvedValue(mockProject as never);
    vi.mocked(getProjectSpec).mockResolvedValue([
      mockSpecRow,
      {
        ...mockSpecRow,
        id: 'pc-2',
        clauseId: 'cl-2',
        sortOrder: 1,
        clause: { id: 'cl-2', code: '01.02', title: 'Standards', body: 'Standards text.' },
      },
    ] as never);
    const response = await GET(new Request('http://localhost'), ctx('proj-1'));
    const data = await response.json() as { sections: Array<{ clauses: unknown[] }> };
    expect(data.sections).toHaveLength(1);
    expect(data.sections[0]?.clauses).toHaveLength(2);
  });

  it('sections from different section IDs produce separate entries', async () => {
    vi.mocked(getProjectById).mockResolvedValue(mockProject as never);
    vi.mocked(getProjectSpec).mockResolvedValue([
      mockSpecRow,
      {
        ...mockSpecRow,
        id: 'pc-2',
        clauseId: 'cl-2',
        clause: { id: 'cl-2', code: '02.01', title: 'Mix', body: 'Mix design.' },
        section: { id: 'sec-2', code: '02', title: 'Concrete' },
      },
    ] as never);
    const response = await GET(new Request('http://localhost'), ctx('proj-1'));
    const data = await response.json() as { sections: unknown[] };
    expect(data.sections).toHaveLength(2);
  });

  it('includes resolvedBody in each clause', async () => {
    vi.mocked(getProjectById).mockResolvedValue(mockProject as never);
    vi.mocked(getProjectSpec).mockResolvedValue([mockSpecRow] as never);
    const response = await GET(new Request('http://localhost'), ctx('proj-1'));
    const data = await response.json() as {
      sections: Array<{ clauses: Array<{ resolvedBody: string }> }>;
    };
    expect(data.sections[0]?.clauses[0]?.resolvedBody).toBe('Scope text.');
  });

  it('uses bodyOverride when set', async () => {
    vi.mocked(getProjectById).mockResolvedValue(mockProject as never);
    vi.mocked(getProjectSpec).mockResolvedValue([
      { ...mockSpecRow, bodyOverride: 'Custom override.' },
    ] as never);
    const response = await GET(new Request('http://localhost'), ctx('proj-1'));
    const data = await response.json() as {
      sections: Array<{ clauses: Array<{ resolvedBody: string; bodyOverride: string | null }> }>;
    };
    expect(data.sections[0]?.clauses[0]?.resolvedBody).toBe('Custom override.');
  });

  it('includes projectClauseId, clauseId, included, status, notes in each clause', async () => {
    vi.mocked(getProjectById).mockResolvedValue(mockProject as never);
    vi.mocked(getProjectSpec).mockResolvedValue([mockSpecRow] as never);
    const response = await GET(new Request('http://localhost'), ctx('proj-1'));
    const data = await response.json() as {
      sections: Array<{ clauses: Array<Record<string, unknown>> }>;
    };
    const clause = data.sections[0]?.clauses[0];
    expect(clause).toHaveProperty('projectClauseId');
    expect(clause).toHaveProperty('clauseId');
    expect(clause).toHaveProperty('included');
    expect(clause).toHaveProperty('status');
    expect(clause).toHaveProperty('notes');
  });

  it('returns 500 with FETCH_ERROR when database throws', async () => {
    vi.mocked(getProjectById).mockRejectedValue(new Error('DB error'));
    const response = await GET(new Request('http://localhost'), ctx('proj-1'));
    expect(response.status).toBe(500);
    const data = await response.json() as { code: string };
    expect(data.code).toBe('FETCH_ERROR');
  });

  it('returns empty sections array when project has no spec rows', async () => {
    vi.mocked(getProjectById).mockResolvedValue(mockProject as never);
    vi.mocked(getProjectSpec).mockResolvedValue([]);
    const response = await GET(new Request('http://localhost'), ctx('proj-1'));
    const data = await response.json() as { sections: unknown[] };
    expect(data.sections).toHaveLength(0);
  });
});
