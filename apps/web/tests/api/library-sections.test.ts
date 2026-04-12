import { vi, describe, it, expect, beforeEach } from 'vitest';

vi.mock('@spec-writer/db', () => ({
  getSections: vi.fn(),
  createSection: vi.fn(),
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

import { GET, POST } from '../../app/api/library/sections/route.js';
import { getSections, createSection } from '@spec-writer/db';

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const mockSection = {
  id: 'sec-1',
  code: '01',
  title: 'Preliminary',
  parentId: null,
  sortOrder: 1,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

const mockSection2 = {
  id: 'sec-2',
  code: '02',
  title: 'Site Works',
  parentId: null,
  sortOrder: 2,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

// ---------------------------------------------------------------------------
// GET /api/library/sections
// ---------------------------------------------------------------------------

describe('GET /api/library/sections', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns 200 with list of sections', async () => {
    vi.mocked(getSections).mockResolvedValue([mockSection] as never);
    const response = await GET();
    expect(response.status).toBe(200);
    const data = await response.json() as typeof mockSection[];
    expect(data).toHaveLength(1);
    expect(data[0]?.code).toBe('01');
  });

  it('returns empty array when no sections exist', async () => {
    vi.mocked(getSections).mockResolvedValue([]);
    const response = await GET();
    expect(response.status).toBe(200);
    const data = await response.json() as unknown[];
    expect(data).toHaveLength(0);
  });

  it('returns multiple sections', async () => {
    vi.mocked(getSections).mockResolvedValue([mockSection, mockSection2] as never);
    const response = await GET();
    expect(response.status).toBe(200);
    const data = await response.json() as typeof mockSection[];
    expect(data).toHaveLength(2);
    expect(data[0]?.code).toBe('01');
    expect(data[1]?.code).toBe('02');
  });

  it('returns 500 with FETCH_ERROR when database throws', async () => {
    vi.mocked(getSections).mockRejectedValue(new Error('DB error'));
    const response = await GET();
    expect(response.status).toBe(500);
    const data = await response.json() as { code: string };
    expect(data.code).toBe('FETCH_ERROR');
  });

  it('calls getSections with no arguments', async () => {
    vi.mocked(getSections).mockResolvedValue([]);
    await GET();
    expect(getSections).toHaveBeenCalledWith();
  });
});

// ---------------------------------------------------------------------------
// POST /api/library/sections
// ---------------------------------------------------------------------------

describe('POST /api/library/sections', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns 201 with created section', async () => {
    vi.mocked(createSection).mockResolvedValue(mockSection as never);
    const req = new Request('http://localhost', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ code: '01', title: 'Preliminary' }),
    });
    const response = await POST(req);
    expect(response.status).toBe(201);
    const data = await response.json() as typeof mockSection;
    expect(data.code).toBe('01');
    expect(data.title).toBe('Preliminary');
  });

  it('calls createSection with the parsed input', async () => {
    vi.mocked(createSection).mockResolvedValue(mockSection as never);
    const req = new Request('http://localhost', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ code: '03', title: 'Concrete', sortOrder: 3 }),
    });
    await POST(req);
    expect(createSection).toHaveBeenCalledWith(expect.objectContaining({ code: '03', title: 'Concrete', sortOrder: 3 }));
  });

  it('returns 400 with VALIDATION_ERROR when code is missing', async () => {
    const req = new Request('http://localhost', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ title: 'No Code Section' }),
    });
    const response = await POST(req);
    expect(response.status).toBe(400);
    const data = await response.json() as { code: string };
    expect(data.code).toBe('VALIDATION_ERROR');
  });

  it('returns 400 when title is missing', async () => {
    const req = new Request('http://localhost', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ code: '04' }),
    });
    const response = await POST(req);
    expect(response.status).toBe(400);
    const data = await response.json() as { code: string };
    expect(data.code).toBe('VALIDATION_ERROR');
  });

  it('returns 400 when code is empty string', async () => {
    const req = new Request('http://localhost', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ code: '', title: 'Empty Code' }),
    });
    const response = await POST(req);
    expect(response.status).toBe(400);
    const data = await response.json() as { code: string };
    expect(data.code).toBe('VALIDATION_ERROR');
  });

  it('returns 400 when title is empty string', async () => {
    const req = new Request('http://localhost', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ code: '05', title: '' }),
    });
    const response = await POST(req);
    expect(response.status).toBe(400);
  });

  it('sortOrder is optional', async () => {
    vi.mocked(createSection).mockResolvedValue(mockSection as never);
    const req = new Request('http://localhost', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ code: '01', title: 'Preliminary' }),
    });
    const response = await POST(req);
    expect(response.status).toBe(201);
  });

  it('returns 400 when sortOrder is negative', async () => {
    const req = new Request('http://localhost', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ code: '01', title: 'Test', sortOrder: -1 }),
    });
    const response = await POST(req);
    expect(response.status).toBe(400);
  });

  it('returns 500 with CREATE_ERROR when database throws', async () => {
    vi.mocked(createSection).mockRejectedValue(new Error('DB error'));
    const req = new Request('http://localhost', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ code: '01', title: 'Preliminary' }),
    });
    const response = await POST(req);
    expect(response.status).toBe(500);
    const data = await response.json() as { code: string };
    expect(data.code).toBe('CREATE_ERROR');
  });
});
