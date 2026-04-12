import { describe, it, expect } from 'vitest';
import { buildSpecJson } from '../src/json/index.js';
import type { ExportProject, ExportSection } from '../src/index.js';

const project: ExportProject = {
  name: 'Test Project',
  number: 'TP-001',
  client: 'Test Client',
  address: '123 Test St',
};

const sections: ExportSection[] = [
  {
    code: '01',
    title: 'General',
    clauses: [
      { code: '01.01', title: 'Scope', resolvedBody: 'This clause defines the scope.' },
      { code: '01.02', title: 'Standards', resolvedBody: 'All work shall conform to standards.' },
    ],
  },
];

describe('buildSpecJson', () => {
  it('returns an object with project, sections, and metadata', () => {
    const result = buildSpecJson(project, sections);
    expect(result.project).toEqual(project);
    expect(result.sections).toEqual(sections);
    expect(result.clauseCount).toBe(2);
    expect(result.exportedAt).toBeTruthy();
  });

  it('exportedAt is a valid ISO date string', () => {
    const result = buildSpecJson(project, sections);
    const date = new Date(result.exportedAt);
    expect(isNaN(date.getTime())).toBe(false);
  });

  it('counts clauses across all sections', () => {
    const multi: ExportSection[] = [
      ...sections,
      { code: '02', title: 'Concrete', clauses: [{ code: '02.01', title: 'Mix', resolvedBody: 'Mix design.' }] },
    ];
    const result = buildSpecJson(project, multi);
    expect(result.clauseCount).toBe(3);
  });

  it('serialises to valid JSON and back', () => {
    const result = buildSpecJson(project, sections);
    const serialised = JSON.stringify(result);
    const parsed = JSON.parse(serialised) as typeof result;
    expect(parsed.project.name).toBe('Test Project');
    expect(parsed.sections[0]?.clauses[0]?.code).toBe('01.01');
  });

  it('handles empty sections array', () => {
    const result = buildSpecJson(project, []);
    expect(result.sections).toHaveLength(0);
    expect(result.clauseCount).toBe(0);
  });

  it('handles project with null optional fields', () => {
    const minimal: ExportProject = { name: 'Minimal', number: null, client: null, address: null };
    const result = buildSpecJson(minimal, []);
    expect(result.project.name).toBe('Minimal');
    expect(result.project.number).toBeNull();
    expect(result.project.client).toBeNull();
  });

  it('handles project with only required name field', () => {
    const nameOnly: ExportProject = { name: 'Name Only' };
    const result = buildSpecJson(nameOnly, sections);
    expect(result.project.name).toBe('Name Only');
    expect(result.clauseCount).toBe(2);
  });

  it('handles unicode in project name', () => {
    const unicodeProject: ExportProject = { name: 'Résidential — Hébergement' };
    const result = buildSpecJson(unicodeProject, []);
    expect(result.project.name).toBe('Résidential — Hébergement');
  });

  it('correctly counts clauses from sections with zero clauses', () => {
    const mixed: ExportSection[] = [
      { code: '01', title: 'Empty Section', clauses: [] },
      { code: '02', title: 'Full Section', clauses: [{ code: '02.01', title: 'C', resolvedBody: 'B' }] },
    ];
    const result = buildSpecJson(project, mixed);
    expect(result.clauseCount).toBe(1);
  });

  it('includes all section and clause fields in output', () => {
    const result = buildSpecJson(project, sections);
    const sec = result.sections[0]!;
    expect(sec.code).toBe('01');
    expect(sec.title).toBe('General');
    expect(sec.clauses[0]?.code).toBe('01.01');
    expect(sec.clauses[0]?.title).toBe('Scope');
    expect(sec.clauses[0]?.resolvedBody).toBeTruthy();
  });

  it('exportedAt is close to the current time', () => {
    const before = Date.now();
    const result = buildSpecJson(project, sections);
    const after = Date.now();
    const exported = new Date(result.exportedAt).getTime();
    expect(exported).toBeGreaterThanOrEqual(before);
    expect(exported).toBeLessThanOrEqual(after);
  });
});
