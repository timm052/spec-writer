import { vi, describe, it, expect, beforeEach } from 'vitest';

vi.mock('@spec-writer/db', () => ({
  getProjectById: vi.fn(),
  updateProject: vi.fn(),
  deleteProject: vi.fn(),
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

import { GET, PATCH, DELETE } from '../../app/api/projects/[id]/route.js';
import { getProjectById, updateProject, deleteProject } from '@spec-writer/db';

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const mockProject = {
  id: 'proj-1',
  name: 'Test Project',
  number: 'TP-001',
  client: 'ACME Corp',
  address: '123 Main St',
  variables: {},
  status: 'active',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

const ctx = (id: string) => ({ params: Promise.resolve({ id }) });

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('GET /api/projects/[id]', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns 200 with the project when found', async () => {
    vi.mocked(getProjectById).mockResolvedValue(mockProject as never);
    const response = await GET(new Request('http://localhost'), ctx('proj-1'));
    expect(response.status).toBe(200);
    const data = await response.json() as typeof mockProject;
    expect(data.id).toBe('proj-1');
  });

  it('returns 404 with NOT_FOUND when project does not exist', async () => {
    vi.mocked(getProjectById).mockResolvedValue(null);
    const response = await GET(new Request('http://localhost'), ctx('missing'));
    expect(response.status).toBe(404);
    const data = await response.json() as { code: string };
    expect(data.code).toBe('NOT_FOUND');
  });

  it('returns 500 with FETCH_ERROR when database throws', async () => {
    vi.mocked(getProjectById).mockRejectedValue(new Error('DB error'));
    const response = await GET(new Request('http://localhost'), ctx('proj-1'));
    expect(response.status).toBe(500);
    const data = await response.json() as { code: string };
    expect(data.code).toBe('FETCH_ERROR');
  });
});

describe('PATCH /api/projects/[id]', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns 200 with updated project on valid input', async () => {
    const updated = { ...mockProject, name: 'Updated Name' };
    vi.mocked(updateProject).mockResolvedValue(updated as never);
    const req = new Request('http://localhost', {
      method: 'PATCH',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ name: 'Updated Name' }),
    });
    const response = await PATCH(req, ctx('proj-1'));
    expect(response.status).toBe(200);
    const data = await response.json() as typeof mockProject;
    expect(data.name).toBe('Updated Name');
  });

  it('passes the id and parsed body to updateProject', async () => {
    vi.mocked(updateProject).mockResolvedValue(mockProject as never);
    const req = new Request('http://localhost', {
      method: 'PATCH',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ client: 'New Client' }),
    });
    await PATCH(req, ctx('proj-1'));
    expect(updateProject).toHaveBeenCalledWith('proj-1', expect.objectContaining({ client: 'New Client' }));
  });

  it('returns 400 with VALIDATION_ERROR when name is empty string', async () => {
    const req = new Request('http://localhost', {
      method: 'PATCH',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ name: '' }),
    });
    const response = await PATCH(req, ctx('proj-1'));
    expect(response.status).toBe(400);
    const data = await response.json() as { code: string };
    expect(data.code).toBe('VALIDATION_ERROR');
  });

  it('returns 500 with UPDATE_ERROR when database throws', async () => {
    vi.mocked(updateProject).mockRejectedValue(new Error('DB error'));
    const req = new Request('http://localhost', {
      method: 'PATCH',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ name: 'Valid Name' }),
    });
    const response = await PATCH(req, ctx('proj-1'));
    expect(response.status).toBe(500);
    const data = await response.json() as { code: string };
    expect(data.code).toBe('UPDATE_ERROR');
  });
});

describe('DELETE /api/projects/[id]', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns 204 on successful deletion', async () => {
    vi.mocked(deleteProject).mockResolvedValue(undefined as never);
    const response = await DELETE(new Request('http://localhost'), ctx('proj-1'));
    expect(response.status).toBe(204);
  });

  it('returns an empty body on successful deletion', async () => {
    vi.mocked(deleteProject).mockResolvedValue(undefined as never);
    const response = await DELETE(new Request('http://localhost'), ctx('proj-1'));
    const text = await response.text();
    expect(text).toBe('');
  });

  it('calls deleteProject with the correct id', async () => {
    vi.mocked(deleteProject).mockResolvedValue(undefined as never);
    await DELETE(new Request('http://localhost'), ctx('proj-1'));
    expect(deleteProject).toHaveBeenCalledWith('proj-1');
  });

  it('returns 500 with DELETE_ERROR when database throws', async () => {
    vi.mocked(deleteProject).mockRejectedValue(new Error('DB error'));
    const response = await DELETE(new Request('http://localhost'), ctx('proj-1'));
    expect(response.status).toBe(500);
    const data = await response.json() as { code: string };
    expect(data.code).toBe('DELETE_ERROR');
  });
});
