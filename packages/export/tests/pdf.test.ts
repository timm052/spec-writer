import { describe, it, expect } from 'vitest';
import { buildSpecPdf } from '../src/pdf/index.js';
import type { ExportProject, ExportSection } from '../src/index.js';

const project: ExportProject = {
  name: 'Test Project',
  number: 'TP-001',
  client: 'ACME Corp',
  address: '123 Main St',
};

const sections: ExportSection[] = [
  {
    code: '01',
    title: 'General',
    clauses: [
      { code: '01.01', title: 'Scope', resolvedBody: 'All work shall conform to the brief.' },
      { code: '01.02', title: 'Standards', resolvedBody: '<p>Follow NatSpec guidelines.</p>' },
    ],
  },
];

describe('buildSpecPdf', () => {
  it('returns a Buffer', async () => {
    const result = await buildSpecPdf(project, sections);
    expect(Buffer.isBuffer(result)).toBe(true);
  });

  it('returns a non-empty buffer', async () => {
    const result = await buildSpecPdf(project, sections);
    expect(result.length).toBeGreaterThan(0);
  });

  it('output starts with PDF magic bytes %PDF', async () => {
    const result = await buildSpecPdf(project, sections);
    expect(result.slice(0, 4).toString('ascii')).toBe('%PDF');
  });

  it('handles project with no optional fields', async () => {
    const minimal: ExportProject = { name: 'Minimal Project' };
    const result = await buildSpecPdf(minimal, []);
    expect(Buffer.isBuffer(result)).toBe(true);
    expect(result.slice(0, 4).toString('ascii')).toBe('%PDF');
  });

  it('handles empty sections array', async () => {
    const result = await buildSpecPdf(project, []);
    expect(Buffer.isBuffer(result)).toBe(true);
    expect(result.length).toBeGreaterThan(0);
  });

  it('handles multiple sections', async () => {
    const multi: ExportSection[] = [
      { code: '01', title: 'Section One', clauses: [{ code: '01.01', title: 'A', resolvedBody: 'Body A' }] },
      { code: '02', title: 'Section Two', clauses: [{ code: '02.01', title: 'B', resolvedBody: 'Body B' }] },
    ];
    const result = await buildSpecPdf(project, multi);
    expect(Buffer.isBuffer(result)).toBe(true);
    expect(result.length).toBeGreaterThan(0);
  });

  it('handles clauses with HTML body (strips to plain text)', async () => {
    const htmlSections: ExportSection[] = [
      {
        code: '01',
        title: 'Section',
        clauses: [
          {
            code: '01.01',
            title: 'HTML Clause',
            resolvedBody: '<p>First paragraph.</p><ul><li>Item one</li><li>Item two</li></ul>',
          },
        ],
      },
    ];
    const result = await buildSpecPdf(project, htmlSections);
    expect(Buffer.isBuffer(result)).toBe(true);
  });

  it('handles clauses with empty body', async () => {
    const emptySections: ExportSection[] = [
      { code: '01', title: 'Section', clauses: [{ code: '01.01', title: 'Empty', resolvedBody: '' }] },
    ];
    const result = await buildSpecPdf(project, emptySections);
    expect(Buffer.isBuffer(result)).toBe(true);
  });

  it('handles special characters in project name', async () => {
    const specialProject: ExportProject = { name: 'Résidential & Commercial — Phase 1' };
    const result = await buildSpecPdf(specialProject, []);
    expect(Buffer.isBuffer(result)).toBe(true);
  });

  it('handles project with null client and address', async () => {
    const nullFields: ExportProject = { name: 'No Meta', number: null, client: null, address: null };
    const result = await buildSpecPdf(nullFields, sections);
    expect(Buffer.isBuffer(result)).toBe(true);
  });

  it('produces larger output for more clauses', async () => {
    const smallResult = await buildSpecPdf(project, []);
    const largeResult = await buildSpecPdf(project, sections);
    expect(largeResult.length).toBeGreaterThan(smallResult.length);
  });

  it('handles many clauses without throwing (pagination stress test)', async () => {
    const manyClauses = Array.from({ length: 30 }, (_, i) => ({
      code: `01.${String(i + 1).padStart(2, '0')}`,
      title: `Clause ${i + 1}`,
      resolvedBody: `Body text for clause ${i + 1}. This tests paragraph flow and layout under load.`,
    }));
    const result = await buildSpecPdf(project, [{ code: '01', title: 'Large Section', clauses: manyClauses }]);
    expect(Buffer.isBuffer(result)).toBe(true);
    expect(result.slice(0, 4).toString('ascii')).toBe('%PDF');
  });
}, 30_000);
