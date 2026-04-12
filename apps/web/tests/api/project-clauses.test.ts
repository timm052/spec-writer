import { vi, describe, it, expect, beforeEach } from 'vitest';

vi.mock('@spec-writer/db', () => ({
  addClauseToProject: vi.fn(),
  updateProjectClause: vi.fn(),
  removeProjectClause: vi.fn(),
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

import { POST } from '../../app/api/projects/[id]/clauses/route.js';
import { PATCH, DELETE } from '../../app/api/projects/[id]/clauses/[cid]/route.js';
import { addClauseToProject, updateProjectClause, removeProjectClause } from '@spec-writer/db';

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const VALID_UUID = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890';

const mockProjectClause = {
  id: 'pc-1',
  projectId: 'proj-1',
  clauseId: VALID_UUID,
  bodyOverride: null,
  sortOrder: 0,
  included: true,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

const projectCtx = (id: string) => ({ params: Promise.resolve({ id }) });
const clauseCtx = (id: string, cid: string) => ({ params: Promise.resolve({ id, cid }) });

// ---------------------------------------------------------------------------
// POST /api/projects/[id]/clauses
// ---------------------------------------------------------------------------

describe('POST /api/projects/[id]/clauses', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns 201 with created project clause', async () => {
    vi.mocked(addClauseToProject).mockResolvedValue(mockProjectClause as never);
    const req = new Request('http://localhost', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ clauseId: VALID_UUID }),
    });
    const response = await POST(req, projectCtx('proj-1'));
    expect(response.status).toBe(201);
    const data = await response.json() as typeof mockProjectClause;
    expect(data.clauseId).toBe(VALID_UUID);
  });

  it('calls addClauseToProject with project id and clause id', async () => {
    vi.mocked(addClauseToProject).mockResolvedValue(mockProjectClause as never);
    const req = new Request('http://localhost', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ clauseId: VALID_UUID }),
    });
    await POST(req, projectCtx('proj-1'));
    expect(addClauseToProject).toHaveBeenCalledWith('proj-1', expect.objectContaining({ clauseId: VALID_UUID }));
  });

  it('returns 400 with VALIDATION_ERROR when clauseId is missing', async () => {
    const req = new Request('http://localhost', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({}),
    });
    const response = await POST(req, projectCtx('proj-1'));
    expect(response.status).toBe(400);
    const data = await response.json() as { code: string };
    expect(data.code).toBe('VALIDATION_ERROR');
  });

  it('returns 400 when clauseId is not a valid UUID', async () => {
    const req = new Request('http://localhost', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ clauseId: 'not-a-uuid' }),
    });
    const response = await POST(req, projectCtx('proj-1'));
    expect(response.status).toBe(400);
    const data = await response.json() as { code: string };
    expect(data.code).toBe('VALIDATION_ERROR');
  });

  it('accepts optional sortOrder', async () => {
    vi.mocked(addClauseToProject).mockResolvedValue({ ...mockProjectClause, sortOrder: 5 } as never);
    const req = new Request('http://localhost', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ clauseId: VALID_UUID, sortOrder: 5 }),
    });
    const response = await POST(req, projectCtx('proj-1'));
    expect(response.status).toBe(201);
    expect(addClauseToProject).toHaveBeenCalledWith('proj-1', expect.objectContaining({ sortOrder: 5 }));
  });

  it('returns 400 when sortOrder is negative', async () => {
    const req = new Request('http://localhost', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ clauseId: VALID_UUID, sortOrder: -1 }),
    });
    const response = await POST(req, projectCtx('proj-1'));
    expect(response.status).toBe(400);
  });

  it('returns 500 with CREATE_ERROR when database throws', async () => {
    vi.mocked(addClauseToProject).mockRejectedValue(new Error('DB error'));
    const req = new Request('http://localhost', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ clauseId: VALID_UUID }),
    });
    const response = await POST(req, projectCtx('proj-1'));
    expect(response.status).toBe(500);
    const data = await response.json() as { code: string };
    expect(data.code).toBe('CREATE_ERROR');
  });
});

// ---------------------------------------------------------------------------
// PATCH /api/projects/[id]/clauses/[cid]
// ---------------------------------------------------------------------------

describe('PATCH /api/projects/[id]/clauses/[cid]', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns 200 with updated project clause', async () => {
    const updated = { ...mockProjectClause, bodyOverride: 'Custom text.' };
    vi.mocked(updateProjectClause).mockResolvedValue(updated as never);
    const req = new Request('http://localhost', {
      method: 'PATCH',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ bodyOverride: 'Custom text.' }),
    });
    const response = await PATCH(req, clauseCtx('proj-1', 'pc-1'));
    expect(response.status).toBe(200);
    const data = await response.json() as typeof mockProjectClause;
    expect(data.bodyOverride).toBe('Custom text.');
  });

  it('calls updateProjectClause with correct ids and body', async () => {
    vi.mocked(updateProjectClause).mockResolvedValue(mockProjectClause as never);
    const req = new Request('http://localhost', {
      method: 'PATCH',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ sortOrder: 3 }),
    });
    await PATCH(req, clauseCtx('proj-1', 'pc-1'));
    expect(updateProjectClause).toHaveBeenCalledWith('proj-1', 'pc-1', expect.objectContaining({ sortOrder: 3 }));
  });

  it('accepts bodyOverride as null (reset to base clause)', async () => {
    vi.mocked(updateProjectClause).mockResolvedValue(mockProjectClause as never);
    const req = new Request('http://localhost', {
      method: 'PATCH',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ bodyOverride: null }),
    });
    const response = await PATCH(req, clauseCtx('proj-1', 'pc-1'));
    expect(response.status).toBe(200);
    expect(updateProjectClause).toHaveBeenCalledWith('proj-1', 'pc-1', expect.objectContaining({ bodyOverride: null }));
  });

  it('accepts included flag toggle', async () => {
    vi.mocked(updateProjectClause).mockResolvedValue({ ...mockProjectClause, included: false } as never);
    const req = new Request('http://localhost', {
      method: 'PATCH',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ included: false }),
    });
    const response = await PATCH(req, clauseCtx('proj-1', 'pc-1'));
    expect(response.status).toBe(200);
  });

  it('returns 400 with VALIDATION_ERROR when sortOrder is negative', async () => {
    const req = new Request('http://localhost', {
      method: 'PATCH',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ sortOrder: -5 }),
    });
    const response = await PATCH(req, clauseCtx('proj-1', 'pc-1'));
    expect(response.status).toBe(400);
    const data = await response.json() as { code: string };
    expect(data.code).toBe('VALIDATION_ERROR');
  });

  it('accepts empty body (no-op update)', async () => {
    vi.mocked(updateProjectClause).mockResolvedValue(mockProjectClause as never);
    const req = new Request('http://localhost', {
      method: 'PATCH',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({}),
    });
    const response = await PATCH(req, clauseCtx('proj-1', 'pc-1'));
    expect(response.status).toBe(200);
  });

  it('returns 500 with UPDATE_ERROR when database throws', async () => {
    vi.mocked(updateProjectClause).mockRejectedValue(new Error('DB error'));
    const req = new Request('http://localhost', {
      method: 'PATCH',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ sortOrder: 1 }),
    });
    const response = await PATCH(req, clauseCtx('proj-1', 'pc-1'));
    expect(response.status).toBe(500);
    const data = await response.json() as { code: string };
    expect(data.code).toBe('UPDATE_ERROR');
  });
});

// ---------------------------------------------------------------------------
// DELETE /api/projects/[id]/clauses/[cid]
// ---------------------------------------------------------------------------

describe('DELETE /api/projects/[id]/clauses/[cid]', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns 204 on successful deletion', async () => {
    vi.mocked(removeProjectClause).mockResolvedValue(undefined as never);
    const response = await DELETE(new Request('http://localhost'), clauseCtx('proj-1', 'pc-1'));
    expect(response.status).toBe(204);
  });

  it('calls removeProjectClause with the clause id (cid), not the project id', async () => {
    vi.mocked(removeProjectClause).mockResolvedValue(undefined as never);
    await DELETE(new Request('http://localhost'), clauseCtx('proj-1', 'pc-99'));
    expect(removeProjectClause).toHaveBeenCalledWith('pc-99');
  });

  it('returns 500 with DELETE_ERROR when database throws', async () => {
    vi.mocked(removeProjectClause).mockRejectedValue(new Error('DB error'));
    const response = await DELETE(new Request('http://localhost'), clauseCtx('proj-1', 'pc-1'));
    expect(response.status).toBe(500);
    const data = await response.json() as { code: string };
    expect(data.code).toBe('DELETE_ERROR');
  });

  it('returns no body on success (204 is no-content)', async () => {
    vi.mocked(removeProjectClause).mockResolvedValue(undefined as never);
    const response = await DELETE(new Request('http://localhost'), clauseCtx('proj-1', 'pc-1'));
    const text = await response.text();
    expect(text).toBe('');
  });
});
