import { describe, it, expect } from 'vitest';
import { buildSpecDocx } from '../src/docx/index.js';
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
    title: 'General Requirements',
    clauses: [
      { code: '01.01', title: 'Scope', resolvedBody: 'All work shall conform to the brief.' },
      { code: '01.02', title: 'Standards', resolvedBody: '<p>Follow NatSpec guidelines.</p>' },
    ],
  },
];

describe('buildSpecDocx', () => {
  it('returns a Buffer', async () => {
    const result = await buildSpecDocx(project, sections);
    expect(Buffer.isBuffer(result)).toBe(true);
  });

  it('returns a non-empty buffer', async () => {
    const result = await buildSpecDocx(project, sections);
    expect(result.length).toBeGreaterThan(0);
  });

  it('output starts with ZIP/DOCX magic bytes PK', async () => {
    const result = await buildSpecDocx(project, sections);
    // DOCX is a ZIP archive — magic bytes are PK (0x50 0x4B)
    expect(result[0]).toBe(0x50); // P
    expect(result[1]).toBe(0x4b); // K
  });

  it('handles project with no optional fields', async () => {
    const minimal: ExportProject = { name: 'Minimal Project' };
    const result = await buildSpecDocx(minimal, []);
    expect(Buffer.isBuffer(result)).toBe(true);
    expect(result[0]).toBe(0x50);
    expect(result[1]).toBe(0x4b);
  });

  it('handles empty sections array', async () => {
    const result = await buildSpecDocx(project, []);
    expect(Buffer.isBuffer(result)).toBe(true);
    expect(result.length).toBeGreaterThan(0);
  });

  it('handles multiple sections', async () => {
    const multi: ExportSection[] = [
      { code: '01', title: 'Section One', clauses: [{ code: '01.01', title: 'A', resolvedBody: 'Body A' }] },
      { code: '02', title: 'Section Two', clauses: [{ code: '02.01', title: 'B', resolvedBody: 'Body B' }] },
    ];
    const result = await buildSpecDocx(project, multi);
    expect(Buffer.isBuffer(result)).toBe(true);
    expect(result.length).toBeGreaterThan(0);
  });

  it('handles clauses with unordered list HTML content', async () => {
    const listSections: ExportSection[] = [
      {
        code: '01',
        title: 'Section',
        clauses: [{ code: '01.01', title: 'List', resolvedBody: '<ul><li>Item one</li><li>Item two</li></ul>' }],
      },
    ];
    const result = await buildSpecDocx(project, listSections);
    expect(Buffer.isBuffer(result)).toBe(true);
  });

  it('handles clauses with ordered list HTML content', async () => {
    const olSections: ExportSection[] = [
      {
        code: '01',
        title: 'Section',
        clauses: [{ code: '01.01', title: 'Steps', resolvedBody: '<ol><li>Step one</li><li>Step two</li></ol>' }],
      },
    ];
    const result = await buildSpecDocx(project, olSections);
    expect(Buffer.isBuffer(result)).toBe(true);
  });

  it('handles clauses with heading HTML content', async () => {
    const headingSections: ExportSection[] = [
      {
        code: '01',
        title: 'Section',
        clauses: [
          {
            code: '01.01',
            title: 'Headings',
            resolvedBody: '<h1>Main</h1><h2>Sub</h2><h3>Subsub</h3><p>Body.</p>',
          },
        ],
      },
    ];
    const result = await buildSpecDocx(project, headingSections);
    expect(Buffer.isBuffer(result)).toBe(true);
  });

  it('handles clauses with bold and italic formatting', async () => {
    const formattedSections: ExportSection[] = [
      {
        code: '01',
        title: 'Section',
        clauses: [
          {
            code: '01.01',
            title: 'Formatted',
            resolvedBody: '<p>Text with <strong>bold</strong> and <em>italic</em> content.</p>',
          },
        ],
      },
    ];
    const result = await buildSpecDocx(project, formattedSections);
    expect(Buffer.isBuffer(result)).toBe(true);
  });

  it('handles clause with empty body', async () => {
    const emptySections: ExportSection[] = [
      { code: '01', title: 'Section', clauses: [{ code: '01.01', title: 'Empty', resolvedBody: '' }] },
    ];
    const result = await buildSpecDocx(project, emptySections);
    expect(Buffer.isBuffer(result)).toBe(true);
  });

  it('handles project without number', async () => {
    const noNumber: ExportProject = { name: 'No Number' };
    const result = await buildSpecDocx(noNumber, sections);
    expect(Buffer.isBuffer(result)).toBe(true);
  });

  it('handles special characters in project name', async () => {
    const specialProject: ExportProject = { name: 'Résidential & Commercial — Phase 1' };
    const result = await buildSpecDocx(specialProject, sections);
    expect(Buffer.isBuffer(result)).toBe(true);
  });

  it('handles null client and address', async () => {
    const nullFields: ExportProject = { name: 'Test', number: null, client: null, address: null };
    const result = await buildSpecDocx(nullFields, sections);
    expect(Buffer.isBuffer(result)).toBe(true);
  });

  it('handles many clauses without throwing', async () => {
    const manyClauses = Array.from({ length: 20 }, (_, i) => ({
      code: `01.${String(i + 1).padStart(2, '0')}`,
      title: `Clause ${i + 1}`,
      resolvedBody: `Body text for clause ${i + 1}.`,
    }));
    const result = await buildSpecDocx(project, [{ code: '01', title: 'Large Section', clauses: manyClauses }]);
    expect(Buffer.isBuffer(result)).toBe(true);
  });
}, 30_000);
