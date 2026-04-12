import { vi, describe, it, expect, beforeEach } from 'vitest';

vi.mock('@spec-writer/db', () => ({
  searchClauses: vi.fn(),
  createClause: vi.fn(),
  getClauseById: vi.fn(),
  updateClause: vi.fn(),
  deleteClause: vi.fn(),
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

import { GET as listGet, POST as listPost } from '../../app/api/library/clauses/route.js';
import { GET as itemGet, PATCH as itemPatch, DELETE as itemDelete } from '../../app/api/library/clauses/[id]/route.js';
import { searchClauses, createClause, getClauseById, updateClause, deleteClause } from '@spec-writer/db';

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const mockClause = {
  id: 'cl-1',
  sectionId: 'sec-1',
  code: '01.01',
  title: 'Scope of Works',
  body: 'This clause defines the scope.',
  tags: ['general'],
  source: 'natspec',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

const ctx = (id: string) => ({ params: Promise.resolve({ id }) });

// ---------------------------------------------------------------------------
// GET /api/library/clauses
// ---------------------------------------------------------------------------

describe('GET /api/library/clauses', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns 200 with list of clauses', async () => {
    vi.mocked(searchClauses).mockResolvedValue([mockClause] as never);
    const req = new Request('http://localhost/api/library/clauses');
    const response = await listGet(req);
    expect(response.status).toBe(200);
    const data = await response.json() as typeof mockClause[];
    expect(data).toHaveLength(1);
    expect(data[0]?.code).toBe('01.01');
  });

  it('passes search query to searchClauses', async () => {
    vi.mocked(searchClauses).mockResolvedValue([]);
    const req = new Request('http://localhost/api/library/clauses?q=concrete');
    await listGet(req);
    expect(searchClauses).toHaveBeenCalledWith(expect.objectContaining({ q: 'concrete' }));
  });

  it('passes section filter (UUID) to searchClauses', async () => {
    vi.mocked(searchClauses).mockResolvedValue([]);
    const sectionUuid = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890';
    const req = new Request(`http://localhost/api/library/clauses?section=${sectionUuid}`);
    await listGet(req);
    expect(searchClauses).toHaveBeenCalledWith(expect.objectContaining({ section: sectionUuid }));
  });

  it('returns empty array when no clauses match', async () => {
    vi.mocked(searchClauses).mockResolvedValue([]);
    const req = new Request('http://localhost/api/library/clauses?q=notfound');
    const response = await listGet(req);
    expect(response.status).toBe(200);
    const data = await response.json() as unknown[];
    expect(data).toHaveLength(0);
  });

  it('returns 500 with FETCH_ERROR when database throws', async () => {
    vi.mocked(searchClauses).mockRejectedValue(new Error('DB error'));
    const req = new Request('http://localhost/api/library/clauses');
    const response = await listGet(req);
    expect(response.status).toBe(500);
    const data = await response.json() as { code: string };
    expect(data.code).toBe('FETCH_ERROR');
  });
});

// ---------------------------------------------------------------------------
// POST /api/library/clauses
// ---------------------------------------------------------------------------

describe('POST /api/library/clauses', () => {
  beforeEach(() => vi.clearAllMocks());

  it('creates a clause and returns 201', async () => {
    vi.mocked(createClause).mockResolvedValue(mockClause as never);
    const req = new Request('http://localhost/api/library/clauses', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        sectionId: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
        code: '01.01',
        title: 'Scope of Works',
        body: 'Body text.',
      }),
    });
    const response = await listPost(req);
    expect(response.status).toBe(201);
    const data = await response.json() as typeof mockClause;
    expect(data.code).toBe('01.01');
  });

  it('returns 400 when sectionId is missing', async () => {
    const req = new Request('http://localhost/api/library/clauses', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ code: '01.01', title: 'Scope' }),
    });
    const response = await listPost(req);
    expect(response.status).toBe(400);
    const data = await response.json() as { code: string };
    expect(data.code).toBe('VALIDATION_ERROR');
  });

  it('returns 400 when sectionId is not a valid UUID', async () => {
    const req = new Request('http://localhost/api/library/clauses', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ sectionId: 'not-a-uuid', code: '01.01', title: 'Scope' }),
    });
    const response = await listPost(req);
    expect(response.status).toBe(400);
  });

  it('returns 400 when code is empty', async () => {
    const req = new Request('http://localhost/api/library/clauses', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ sectionId: '00000000-0000-0000-0000-000000000001', code: '', title: 'Scope' }),
    });
    const response = await listPost(req);
    expect(response.status).toBe(400);
  });

  it('returns 500 with CREATE_ERROR when database throws', async () => {
    vi.mocked(createClause).mockRejectedValue(new Error('DB error'));
    const req = new Request('http://localhost/api/library/clauses', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        sectionId: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
        code: '01.01',
        title: 'Scope',
      }),
    });
    const response = await listPost(req);
    expect(response.status).toBe(500);
    const data = await response.json() as { code: string };
    expect(data.code).toBe('CREATE_ERROR');
  });
});

// ---------------------------------------------------------------------------
// GET /api/library/clauses/[id]
// ---------------------------------------------------------------------------

describe('GET /api/library/clauses/[id]', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns 200 with the clause when found', async () => {
    vi.mocked(getClauseById).mockResolvedValue(mockClause as never);
    const response = await itemGet(new Request('http://localhost'), ctx('cl-1'));
    expect(response.status).toBe(200);
    const data = await response.json() as typeof mockClause;
    expect(data.id).toBe('cl-1');
  });

  it('returns 404 with NOT_FOUND when clause does not exist', async () => {
    vi.mocked(getClauseById).mockResolvedValue(null);
    const response = await itemGet(new Request('http://localhost'), ctx('missing'));
    expect(response.status).toBe(404);
    const data = await response.json() as { code: string };
    expect(data.code).toBe('NOT_FOUND');
  });

  it('returns 500 with FETCH_ERROR when database throws', async () => {
    vi.mocked(getClauseById).mockRejectedValue(new Error('DB error'));
    const response = await itemGet(new Request('http://localhost'), ctx('cl-1'));
    expect(response.status).toBe(500);
    const data = await response.json() as { code: string };
    expect(data.code).toBe('FETCH_ERROR');
  });
});

// ---------------------------------------------------------------------------
// PATCH /api/library/clauses/[id]
// ---------------------------------------------------------------------------

describe('PATCH /api/library/clauses/[id]', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns 200 with updated clause', async () => {
    vi.mocked(updateClause).mockResolvedValue({ ...mockClause, title: 'Updated' } as never);
    const req = new Request('http://localhost', {
      method: 'PATCH',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ title: 'Updated' }),
    });
    const response = await itemPatch(req, ctx('cl-1'));
    expect(response.status).toBe(200);
    const data = await response.json() as typeof mockClause;
    expect(data.title).toBe('Updated');
  });

  it('returns 400 when code is updated to empty string', async () => {
    const req = new Request('http://localhost', {
      method: 'PATCH',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ code: '' }),
    });
    const response = await itemPatch(req, ctx('cl-1'));
    expect(response.status).toBe(400);
    const data = await response.json() as { code: string };
    expect(data.code).toBe('VALIDATION_ERROR');
  });

  it('returns 500 with UPDATE_ERROR when database throws', async () => {
    vi.mocked(updateClause).mockRejectedValue(new Error('DB error'));
    const req = new Request('http://localhost', {
      method: 'PATCH',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ title: 'Updated' }),
    });
    const response = await itemPatch(req, ctx('cl-1'));
    expect(response.status).toBe(500);
    const data = await response.json() as { code: string };
    expect(data.code).toBe('UPDATE_ERROR');
  });
});

// ---------------------------------------------------------------------------
// DELETE /api/library/clauses/[id]
// ---------------------------------------------------------------------------

describe('DELETE /api/library/clauses/[id]', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns 204 on successful deletion', async () => {
    vi.mocked(deleteClause).mockResolvedValue(undefined as never);
    const response = await itemDelete(new Request('http://localhost'), ctx('cl-1'));
    expect(response.status).toBe(204);
  });

  it('calls deleteClause with the correct id', async () => {
    vi.mocked(deleteClause).mockResolvedValue(undefined as never);
    await itemDelete(new Request('http://localhost'), ctx('cl-1'));
    expect(deleteClause).toHaveBeenCalledWith('cl-1');
  });

  it('returns 500 with DELETE_ERROR when database throws', async () => {
    vi.mocked(deleteClause).mockRejectedValue(new Error('DB error'));
    const response = await itemDelete(new Request('http://localhost'), ctx('cl-1'));
    expect(response.status).toBe(500);
    const data = await response.json() as { code: string };
    expect(data.code).toBe('DELETE_ERROR');
  });
});
