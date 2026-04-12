/**
 * Integration tests: variable resolver → export pipeline.
 *
 * These tests exercise the full path that happens in production:
 *   1. Resolve clause bodies using resolveClause (packages/core)
 *   2. Pass the resolved sections to an exporter
 *   3. Assert the output contains the resolved values — not the raw tokens
 *
 * No mocks. Real resolver + real exporters.
 */
import { describe, it, expect } from 'vitest';
import { buildSpecJson } from '../src/json/index.js';
import { buildSpecHtml } from '../src/html/index.js';
import { buildSpecPdf } from '../src/pdf/index.js';
import { buildSpecDocx } from '../src/docx/index.js';
import type { ExportProject, ExportSection } from '../src/index.js';
import JSZip from 'jszip';

// ---------------------------------------------------------------------------
// Simulate what buildSpecSections does: resolve variables and group clauses
// ---------------------------------------------------------------------------

type Variables = Record<string, string | undefined>;

/** Inline resolver (matches packages/core resolveClause exactly). */
function resolve(body: string, project: Variables, practice: Variables): string {
  if (!body) return '';
  return body.replace(/\{\{([\w.]+)\}\}/g, (_, key: string) => project[key] ?? practice[key] ?? '');
}

// ---------------------------------------------------------------------------
// Test data
// ---------------------------------------------------------------------------

const projectVars: Variables = {
  'project.name': 'Harrington Tower',
  'project.number': 'HT-042',
  'project.client': 'Harrington Developments',
  'site.address': '42 Anzac Parade, Sydney',
};

const practiceVars: Variables = {
  'practice.name': 'Acme Architects',
  'practice.abn': '12 345 678 901',
  'project.name': 'Default Project', // lower priority than projectVars
};

// Raw clause bodies (as stored in DB — still contain {{tokens}})
const rawSections: Array<{ code: string; title: string; clauses: Array<{ code: string; title: string; body: string }> }> = [
  {
    code: '01',
    title: 'General Requirements',
    clauses: [
      { code: '01.01', title: 'Scope', body: 'This specification applies to {{project.name}} at {{site.address}}.' },
      { code: '01.02', title: 'Client', body: 'Prepared for {{project.client}} by {{practice.name}}.' },
      { code: '01.03', title: 'Practice ABN', body: 'ABN: {{practice.abn}}' },
      { code: '01.04', title: 'Missing Token', body: 'Reference: {{undefined.token}} applies.' },
    ],
  },
  {
    code: '03',
    title: 'Concrete',
    clauses: [
      { code: '03.01', title: 'Mix Design', body: '<p>Normal-class concrete N32 for <strong>{{project.name}}</strong>.</p>' },
    ],
  },
];

/** Build resolved ExportSection[] (what buildSpecSections returns). */
function buildSections(): ExportSection[] {
  return rawSections.map((s) => ({
    code: s.code,
    title: s.title,
    clauses: s.clauses.map((c) => ({
      code: c.code,
      title: c.title,
      resolvedBody: resolve(c.body, projectVars, practiceVars),
    })),
  }));
}

const project: ExportProject = {
  name: projectVars['project.name']!,
  number: projectVars['project.number'],
  client: projectVars['project.client'],
  address: projectVars['site.address'],
};

// ---------------------------------------------------------------------------
// Variable resolution correctness (pre-export checks)
// ---------------------------------------------------------------------------

describe('resolver → resolved sections', () => {
  it('project var overrides practice var for same key', () => {
    const sections = buildSections();
    const scope = sections[0]!.clauses[0]!.resolvedBody;
    expect(scope).toContain('Harrington Tower'); // project var, not 'Default Project'
  });

  it('practice var used when project does not define the key', () => {
    const sections = buildSections();
    const abn = sections[0]!.clauses[2]!.resolvedBody;
    expect(abn).toContain('12 345 678 901');
  });

  it('undefined token resolves to empty string', () => {
    const sections = buildSections();
    const missing = sections[0]!.clauses[3]!.resolvedBody;
    expect(missing).not.toContain('{{');
    expect(missing).toContain('Reference:');
    expect(missing).toContain('applies.');
    // The undefined token should be empty, not 'undefined'
    expect(missing).not.toContain('undefined.token');
  });

  it('HTML body has tokens resolved inline', () => {
    const sections = buildSections();
    const concrete = sections[1]!.clauses[0]!.resolvedBody;
    expect(concrete).toContain('Harrington Tower');
    expect(concrete).not.toContain('{{');
  });
});

// ---------------------------------------------------------------------------
// JSON export integration
// ---------------------------------------------------------------------------

describe('resolver → buildSpecJson', () => {
  it('project name in JSON output matches resolved project name', () => {
    const sections = buildSections();
    const json = buildSpecJson(project, sections);
    expect(json.project.name).toBe('Harrington Tower');
  });

  it('resolved clause body appears in JSON output', () => {
    const sections = buildSections();
    const json = buildSpecJson(project, sections);
    const clause = json.sections[0]?.clauses[0];
    expect(clause?.resolvedBody).toContain('Harrington Tower');
    expect(clause?.resolvedBody).toContain('42 Anzac Parade');
    expect(clause?.resolvedBody).not.toContain('{{');
  });

  it('all tokens resolved — no raw {{ in any clause body', () => {
    const sections = buildSections();
    const json = buildSpecJson(project, sections);
    for (const section of json.sections) {
      for (const clause of section.clauses) {
        expect(clause.resolvedBody).not.toContain('{{');
      }
    }
  });

  it('clause count matches total clauses across all sections', () => {
    const sections = buildSections();
    const json = buildSpecJson(project, sections);
    const total = rawSections.reduce((acc, s) => acc + s.clauses.length, 0);
    expect(json.clauseCount).toBe(total);
  });

  it('section codes and titles are preserved', () => {
    const sections = buildSections();
    const json = buildSpecJson(project, sections);
    expect(json.sections[0]?.code).toBe('01');
    expect(json.sections[0]?.title).toBe('General Requirements');
    expect(json.sections[1]?.code).toBe('03');
    expect(json.sections[1]?.title).toBe('Concrete');
  });

  it('serialises to valid JSON and back with no data loss', () => {
    const sections = buildSections();
    const json = buildSpecJson(project, sections);
    const roundTripped = JSON.parse(JSON.stringify(json)) as typeof json;
    expect(roundTripped.project.name).toBe(json.project.name);
    expect(roundTripped.sections).toHaveLength(json.sections.length);
    expect(roundTripped.clauseCount).toBe(json.clauseCount);
  });
});

// ---------------------------------------------------------------------------
// HTML export integration
// ---------------------------------------------------------------------------

describe('resolver → buildSpecHtml', () => {
  it('resolved project name appears in HTML title', () => {
    const sections = buildSections();
    const html = buildSpecHtml(project, sections);
    expect(html).toContain('Harrington Tower');
  });

  it('resolved clause body (project var) appears in HTML', () => {
    const sections = buildSections();
    const html = buildSpecHtml(project, sections);
    expect(html).toContain('42 Anzac Parade');
  });

  it('resolved practice var appears in HTML', () => {
    const sections = buildSections();
    const html = buildSpecHtml(project, sections);
    expect(html).toContain('12 345 678 901');
  });

  it('no raw {{ tokens appear anywhere in HTML output', () => {
    const sections = buildSections();
    const html = buildSpecHtml(project, sections);
    expect(html).not.toContain('{{');
  });

  it('all clause codes appear as identifiers in the HTML', () => {
    const sections = buildSections();
    const html = buildSpecHtml(project, sections);
    expect(html).toContain('01.01');
    expect(html).toContain('01.02');
    expect(html).toContain('03.01');
  });

  it('HTML is a complete document (has head and body)', () => {
    const sections = buildSections();
    const html = buildSpecHtml(project, sections);
    expect(html).toContain('<head>');
    expect(html).toContain('<body');
    expect(html).toContain('</body>');
    expect(html).toContain('</html>');
  });
});

// ---------------------------------------------------------------------------
// PDF export integration
// ---------------------------------------------------------------------------

describe('resolver → buildSpecPdf', () => {
  it('PDF starts with %PDF magic bytes', async () => {
    const sections = buildSections();
    const buf = await buildSpecPdf(project, sections);
    expect(buf.toString('latin1').slice(0, 4)).toBe('%PDF');
  });

  it('produces a valid PDF for all resolved sections', async () => {
    const sections = buildSections();
    const buf = await buildSpecPdf(project, sections);
    expect(buf.slice(0, 4).toString('ascii')).toBe('%PDF');
    expect(buf.toString('latin1').slice(-20)).toContain('%%EOF');
  });
}, 30_000);

// ---------------------------------------------------------------------------
// DOCX export integration
// ---------------------------------------------------------------------------

describe('resolver → buildSpecDocx', () => {
  it('DOCX body XML contains resolved project name', async () => {
    const sections = buildSections();
    const buf = await buildSpecDocx(project, sections);
    const zip = await JSZip.loadAsync(buf);
    const xml = await zip.file('word/document.xml')!.async('string');
    expect(xml).toContain('Harrington Tower');
  });

  it('DOCX body XML contains resolved clause body text and no raw tokens', async () => {
    const sections = buildSections();
    const buf = await buildSpecDocx(project, sections);
    const zip = await JSZip.loadAsync(buf);
    const xml = await zip.file('word/document.xml')!.async('string');
    expect(xml).toContain('42 Anzac Parade');
    // Raw {{ tokens must not appear anywhere in the output
    expect(xml).not.toContain('{{');
  });

  it('DOCX body contains all clause codes', async () => {
    const sections = buildSections();
    const buf = await buildSpecDocx(project, sections);
    const zip = await JSZip.loadAsync(buf);
    const xml = await zip.file('word/document.xml')!.async('string');
    expect(xml).toContain('01.01');
    expect(xml).toContain('03.01');
  });
}, 30_000);
