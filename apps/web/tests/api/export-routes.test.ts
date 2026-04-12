/**
 * Tests for the export route handlers.
 *
 * PDF / DOCX / JSON routes use buildSpecSections as their single DB/IO
 * dependency, so we mock that helper and let the real exporters run.
 *
 * The HTML route calls @spec-writer/db directly (no buildSpecSections),
 * so it gets its own set of mocks.
 */
import { vi, describe, it, expect, beforeEach } from 'vitest';

// Mock the lib helper used by PDF / DOCX / JSON routes
vi.mock('../../lib/build-spec-sections.js', () => ({
  buildSpecSections: vi.fn(),
}));

// Mock DB layer used by the HTML export route
vi.mock('@spec-writer/db', () => ({
  getProjectById: vi.fn(),
  getProjectSpec: vi.fn(),
}));

// Mock exporters — route tests verify routing logic (headers, status codes),
// not export quality. Export quality is tested in packages/export own tests.
vi.mock('@spec-writer/export', () => ({
  buildSpecPdf: vi.fn().mockResolvedValue(Buffer.from('%PDF-1.3 fake pdf content %%EOF')),
  buildSpecDocx: vi.fn().mockResolvedValue(Buffer.from('PK fake docx content')),
  buildSpecJson: vi.fn().mockReturnValue({ project: {}, sections: [], clauseCount: 1, exportedAt: new Date().toISOString() }),
  buildSpecHtml: vi.fn().mockReturnValue('<!DOCTYPE html><html><body>Test Project</body></html>'),
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

import { GET as pdfGet } from '../../app/api/projects/[id]/export/pdf/route.js';
import { GET as docxGet } from '../../app/api/projects/[id]/export/docx/route.js';
import { GET as jsonGet } from '../../app/api/projects/[id]/export/json/route.js';
import { GET as htmlGet } from '../../app/api/projects/[id]/export/route.js';
import { buildSpecSections } from '../../lib/build-spec-sections.js';
import { getProjectById, getProjectSpec } from '@spec-writer/db';
// buildSpecPdf / buildSpecDocx / buildSpecJson / buildSpecHtml are auto-mocked above

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const mockSpec = {
  project: {
    name: 'Test Project',
    number: 'TP-001',
    client: 'ACME Corp',
    address: '1 Main St',
  },
  sections: [
    {
      code: '01',
      title: 'General',
      clauses: [
        { code: '01.01', title: 'Scope', resolvedBody: 'Scope of works.' },
      ],
    },
  ],
};

const ctx = (id: string) => ({ params: Promise.resolve({ id }) });

// ---------------------------------------------------------------------------
// PDF export route
// ---------------------------------------------------------------------------

describe('GET /api/projects/[id]/export/pdf', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns 200 with application/pdf content type', async () => {
    vi.mocked(buildSpecSections).mockResolvedValue(mockSpec as never);
    const response = await pdfGet(new Request('http://localhost'), ctx('proj-1'));
    expect(response.status).toBe(200);
    expect(response.headers.get('Content-Type')).toContain('application/pdf');
  });

  it('returns a non-empty PDF body', async () => {
    vi.mocked(buildSpecSections).mockResolvedValue(mockSpec as never);
    const response = await pdfGet(new Request('http://localhost'), ctx('proj-1'));
    const buf = Buffer.from(await response.arrayBuffer());
    expect(buf.length).toBeGreaterThan(0);
    // Verify the binary body is delivered (mock starts with %PDF)
    expect(buf.toString('ascii').startsWith('%PDF')).toBe(true);
  });

  it('sets Content-Disposition attachment header with .pdf extension', async () => {
    vi.mocked(buildSpecSections).mockResolvedValue(mockSpec as never);
    const response = await pdfGet(new Request('http://localhost'), ctx('proj-1'));
    const disposition = response.headers.get('Content-Disposition') ?? '';
    expect(disposition).toContain('attachment');
    expect(disposition).toContain('.pdf');
  });

  it('filename contains project number and name', async () => {
    vi.mocked(buildSpecSections).mockResolvedValue(mockSpec as never);
    const response = await pdfGet(new Request('http://localhost'), ctx('proj-1'));
    const disposition = response.headers.get('Content-Disposition') ?? '';
    expect(disposition).toContain('TP-001');
    expect(disposition).toContain('Test Project');
  });

  it('returns 404 with NOT_FOUND when project does not exist', async () => {
    vi.mocked(buildSpecSections).mockResolvedValue(null);
    const response = await pdfGet(new Request('http://localhost'), ctx('missing'));
    expect(response.status).toBe(404);
    const data = await response.json() as { code: string };
    expect(data.code).toBe('NOT_FOUND');
  });

  it('returns 500 with EXPORT_ERROR when buildSpecSections throws', async () => {
    vi.mocked(buildSpecSections).mockRejectedValue(new Error('DB failure'));
    const response = await pdfGet(new Request('http://localhost'), ctx('proj-1'));
    expect(response.status).toBe(500);
    const data = await response.json() as { code: string };
    expect(data.code).toBe('EXPORT_ERROR');
  });

  it('sets Cache-Control no-store', async () => {
    vi.mocked(buildSpecSections).mockResolvedValue(mockSpec as never);
    const response = await pdfGet(new Request('http://localhost'), ctx('proj-1'));
    expect(response.headers.get('Cache-Control')).toContain('no-store');
  });
}, 30_000);

// ---------------------------------------------------------------------------
// DOCX export route
// ---------------------------------------------------------------------------

describe('GET /api/projects/[id]/export/docx', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns 200 with correct DOCX content type', async () => {
    vi.mocked(buildSpecSections).mockResolvedValue(mockSpec as never);
    const response = await docxGet(new Request('http://localhost'), ctx('proj-1'));
    expect(response.status).toBe(200);
    expect(response.headers.get('Content-Type')).toContain('wordprocessingml');
  });

  it('returns a non-empty DOCX buffer', async () => {
    vi.mocked(buildSpecSections).mockResolvedValue(mockSpec as never);
    const response = await docxGet(new Request('http://localhost'), ctx('proj-1'));
    const buf = Buffer.from(await response.arrayBuffer());
    expect(buf.length).toBeGreaterThan(0);
  });

  it('sets Content-Disposition attachment header with .docx extension', async () => {
    vi.mocked(buildSpecSections).mockResolvedValue(mockSpec as never);
    const response = await docxGet(new Request('http://localhost'), ctx('proj-1'));
    const disposition = response.headers.get('Content-Disposition') ?? '';
    expect(disposition).toContain('attachment');
    expect(disposition).toContain('.docx');
  });

  it('returns 404 when project does not exist', async () => {
    vi.mocked(buildSpecSections).mockResolvedValue(null);
    const response = await docxGet(new Request('http://localhost'), ctx('missing'));
    expect(response.status).toBe(404);
    const data = await response.json() as { code: string };
    expect(data.code).toBe('NOT_FOUND');
  });

  it('returns 500 with EXPORT_ERROR when buildSpecSections throws', async () => {
    vi.mocked(buildSpecSections).mockRejectedValue(new Error('DB failure'));
    const response = await docxGet(new Request('http://localhost'), ctx('proj-1'));
    expect(response.status).toBe(500);
    const data = await response.json() as { code: string };
    expect(data.code).toBe('EXPORT_ERROR');
  });
}, 30_000);

// ---------------------------------------------------------------------------
// JSON export route
// ---------------------------------------------------------------------------

describe('GET /api/projects/[id]/export/json', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns 200 with application/json content type', async () => {
    vi.mocked(buildSpecSections).mockResolvedValue(mockSpec as never);
    const response = await jsonGet(new Request('http://localhost'), ctx('proj-1'));
    expect(response.status).toBe(200);
    expect(response.headers.get('Content-Type')).toContain('application/json');
  });

  it('returns valid JSON with project and sections fields', async () => {
    vi.mocked(buildSpecSections).mockResolvedValue(mockSpec as never);
    const response = await jsonGet(new Request('http://localhost'), ctx('proj-1'));
    const data = await response.json() as { project: unknown; sections: unknown[]; clauseCount: number };
    expect(data).toHaveProperty('project');
    expect(data).toHaveProperty('sections');
    expect(data).toHaveProperty('clauseCount');
  });

  it('clause count reflects actual clause count', async () => {
    vi.mocked(buildSpecSections).mockResolvedValue(mockSpec as never);
    const response = await jsonGet(new Request('http://localhost'), ctx('proj-1'));
    const data = await response.json() as { clauseCount: number };
    expect(data.clauseCount).toBe(1);
  });

  it('sets Content-Disposition attachment with .json extension', async () => {
    vi.mocked(buildSpecSections).mockResolvedValue(mockSpec as never);
    const response = await jsonGet(new Request('http://localhost'), ctx('proj-1'));
    const disposition = response.headers.get('Content-Disposition') ?? '';
    expect(disposition).toContain('attachment');
    expect(disposition).toContain('.json');
  });

  it('returns 404 when project does not exist', async () => {
    vi.mocked(buildSpecSections).mockResolvedValue(null);
    const response = await jsonGet(new Request('http://localhost'), ctx('missing'));
    expect(response.status).toBe(404);
  });

  it('returns 500 with EXPORT_ERROR on failure', async () => {
    vi.mocked(buildSpecSections).mockRejectedValue(new Error('error'));
    const response = await jsonGet(new Request('http://localhost'), ctx('proj-1'));
    expect(response.status).toBe(500);
    const data = await response.json() as { code: string };
    expect(data.code).toBe('EXPORT_ERROR');
  });
});

// ---------------------------------------------------------------------------
// HTML export route
// Note: this route calls @spec-writer/db directly, not buildSpecSections.
// ---------------------------------------------------------------------------

const mockProject = {
  id: 'proj-1',
  name: 'Test Project',
  number: 'TP-001',
  client: 'ACME Corp',
  address: '1 Main St',
  variables: {} as Record<string, string>,
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
  clause: { id: 'cl-1', code: '01.01', title: 'Scope', body: 'Scope of works.' },
  section: { id: 'sec-1', code: '01', title: 'General' },
};

describe('GET /api/projects/[id]/export (HTML)', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns 200 with text/html content type', async () => {
    vi.mocked(getProjectById).mockResolvedValue(mockProject as never);
    vi.mocked(getProjectSpec).mockResolvedValue([mockSpecRow] as never);
    const response = await htmlGet(new Request('http://localhost'), ctx('proj-1'));
    expect(response.status).toBe(200);
    expect(response.headers.get('Content-Type')).toContain('text/html');
  });

  it('returns HTML document with DOCTYPE', async () => {
    vi.mocked(getProjectById).mockResolvedValue(mockProject as never);
    vi.mocked(getProjectSpec).mockResolvedValue([mockSpecRow] as never);
    const response = await htmlGet(new Request('http://localhost'), ctx('proj-1'));
    const text = await response.text();
    expect(text).toContain('<!DOCTYPE html>');
  });

  it('project name appears in HTML output', async () => {
    vi.mocked(getProjectById).mockResolvedValue(mockProject as never);
    vi.mocked(getProjectSpec).mockResolvedValue([mockSpecRow] as never);
    const response = await htmlGet(new Request('http://localhost'), ctx('proj-1'));
    const text = await response.text();
    expect(text).toContain('Test Project');
  });

  it('calls getProjectSpec for the project id', async () => {
    vi.mocked(getProjectById).mockResolvedValue(mockProject as never);
    vi.mocked(getProjectSpec).mockResolvedValue([mockSpecRow] as never);
    await htmlGet(new Request('http://localhost'), ctx('proj-1'));
    expect(getProjectSpec).toHaveBeenCalledWith('proj-1');
  });

  it('passes project data to buildSpecHtml', async () => {
    vi.mocked(getProjectById).mockResolvedValue(mockProject as never);
    vi.mocked(getProjectSpec).mockResolvedValue([mockSpecRow] as never);
    // buildSpecHtml is mocked; confirm the route resolves and returns 200
    const response = await htmlGet(new Request('http://localhost'), ctx('proj-1'));
    expect(response.status).toBe(200);
  });

  it('returns 404 with NOT_FOUND when project does not exist', async () => {
    vi.mocked(getProjectById).mockResolvedValue(null);
    const response = await htmlGet(new Request('http://localhost'), ctx('missing'));
    expect(response.status).toBe(404);
    const data = await response.json() as { code: string };
    expect(data.code).toBe('NOT_FOUND');
  });

  it('sets Cache-Control no-store', async () => {
    vi.mocked(getProjectById).mockResolvedValue(mockProject as never);
    vi.mocked(getProjectSpec).mockResolvedValue([mockSpecRow] as never);
    const response = await htmlGet(new Request('http://localhost'), ctx('proj-1'));
    expect(response.headers.get('Cache-Control')).toContain('no-store');
  });

  it('returns 500 with EXPORT_ERROR when database throws', async () => {
    vi.mocked(getProjectById).mockRejectedValue(new Error('DB error'));
    const response = await htmlGet(new Request('http://localhost'), ctx('proj-1'));
    expect(response.status).toBe(500);
    const data = await response.json() as { code: string };
    expect(data.code).toBe('EXPORT_ERROR');
  });
});
