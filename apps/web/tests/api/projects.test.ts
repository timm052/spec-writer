import { vi, describe, it, expect, beforeEach } from 'vitest';

vi.mock('@spec-writer/db', () => ({
  getProjects: vi.fn(),
  createProject: vi.fn(),
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

import { GET, POST } from '../../app/api/projects/route.js';
import { getProjects, createProject } from '@spec-writer/db';

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

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('GET /api/projects', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns 200 with a list of projects', async () => {
    vi.mocked(getProjects).mockResolvedValue([mockProject] as never);
    const response = await GET();
    expect(response.status).toBe(200);
    const data = await response.json() as typeof mockProject[];
    expect(data).toHaveLength(1);
    expect(data[0]?.name).toBe('Test Project');
  });

  it('returns an empty array when no projects exist', async () => {
    vi.mocked(getProjects).mockResolvedValue([]);
    const response = await GET();
    expect(response.status).toBe(200);
    const data = await response.json() as unknown[];
    expect(data).toHaveLength(0);
  });

  it('returns 500 with FETCH_ERROR code when database throws', async () => {
    vi.mocked(getProjects).mockRejectedValue(new Error('DB connection failed'));
    const response = await GET();
    expect(response.status).toBe(500);
    const data = await response.json() as { code: string };
    expect(data.code).toBe('FETCH_ERROR');
  });
});

describe('POST /api/projects', () => {
  beforeEach(() => vi.clearAllMocks());

  it('creates a project and returns 201', async () => {
    vi.mocked(createProject).mockResolvedValue(mockProject as never);
    const req = new Request('http://localhost/api/projects', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ name: 'Test Project' }),
    });
    const response = await POST(req);
    expect(response.status).toBe(201);
    const data = await response.json() as typeof mockProject;
    expect(data.name).toBe('Test Project');
  });

  it('calls createProject with the parsed input', async () => {
    vi.mocked(createProject).mockResolvedValue(mockProject as never);
    const req = new Request('http://localhost/api/projects', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ name: 'New Project', number: 'NP-01' }),
    });
    await POST(req);
    expect(createProject).toHaveBeenCalledWith(expect.objectContaining({ name: 'New Project', number: 'NP-01' }));
  });

  it('returns 400 with VALIDATION_ERROR when name is missing', async () => {
    const req = new Request('http://localhost/api/projects', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ number: 'P-001' }),
    });
    const response = await POST(req);
    expect(response.status).toBe(400);
    const data = await response.json() as { code: string };
    expect(data.code).toBe('VALIDATION_ERROR');
  });

  it('returns 400 when name is an empty string', async () => {
    const req = new Request('http://localhost/api/projects', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ name: '' }),
    });
    const response = await POST(req);
    expect(response.status).toBe(400);
    const data = await response.json() as { code: string };
    expect(data.code).toBe('VALIDATION_ERROR');
  });

  it('returns 500 with CREATE_ERROR when database throws', async () => {
    vi.mocked(createProject).mockRejectedValue(new Error('DB error'));
    const req = new Request('http://localhost/api/projects', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ name: 'Project' }),
    });
    const response = await POST(req);
    expect(response.status).toBe(500);
    const data = await response.json() as { code: string };
    expect(data.code).toBe('CREATE_ERROR');
  });
});
