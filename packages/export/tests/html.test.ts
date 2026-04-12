import { describe, it, expect } from 'vitest';
import { buildSpecHtml } from '../src/html/index.js';
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
      { code: '01.01', title: 'Scope', resolvedBody: '<p>All work shall conform to the brief.</p>' },
      { code: '01.02', title: 'Standards', resolvedBody: 'Follow NatSpec guidelines.' },
    ],
  },
];

describe('buildSpecHtml', () => {
  it('returns a string', () => {
    expect(typeof buildSpecHtml(project, sections)).toBe('string');
  });

  it('includes DOCTYPE declaration', () => {
    expect(buildSpecHtml(project, sections)).toContain('<!DOCTYPE html>');
  });

  it('includes UTF-8 charset meta tag', () => {
    expect(buildSpecHtml(project, sections)).toContain('charset="UTF-8"');
  });

  it('includes the project name in the <title> tag', () => {
    expect(buildSpecHtml(project, sections)).toContain('<title>Test Project');
  });

  it('includes the project name as the document heading', () => {
    const result = buildSpecHtml(project, sections);
    expect(result).toContain('class="doc-title"');
    expect(result).toContain('Test Project');
  });

  it('includes section heading with code and title', () => {
    const result = buildSpecHtml(project, sections);
    expect(result).toContain('01');
    expect(result).toContain('General Requirements');
  });

  it('includes clause code and title', () => {
    const result = buildSpecHtml(project, sections);
    expect(result).toContain('01.01');
    expect(result).toContain('Scope');
  });

  it('renders HTML clause body without double-wrapping', () => {
    const result = buildSpecHtml(project, sections);
    expect(result).toContain('All work shall conform to the brief.');
  });

  it('wraps plain-text clause body in <p> tags', () => {
    const result = buildSpecHtml(project, sections);
    expect(result).toContain('<p>Follow NatSpec guidelines.</p>');
  });

  it('escapes < > characters in project name', () => {
    const xssProject: ExportProject = { name: '<script>alert(1)</script>' };
    const result = buildSpecHtml(xssProject, []);
    expect(result).not.toContain('<script>');
    expect(result).toContain('&lt;script&gt;');
  });

  it('escapes & in project name', () => {
    const ampProject: ExportProject = { name: 'Smith & Jones' };
    const result = buildSpecHtml(ampProject, []);
    expect(result).toContain('Smith &amp; Jones');
    expect(result).not.toContain('Smith & Jones');
  });

  it('escapes " in project name', () => {
    const quoteProject: ExportProject = { name: 'Project "Alpha"' };
    const result = buildSpecHtml(quoteProject, []);
    expect(result).toContain('Project &quot;Alpha&quot;');
  });

  it('includes meta info (number · client · address) when all present', () => {
    const result = buildSpecHtml(project, sections);
    expect(result).toContain('TP-001');
    expect(result).toContain('ACME Corp');
    expect(result).toContain('123 Main St');
  });

  it('omits doc-meta paragraph when all optional fields are absent', () => {
    const minimal: ExportProject = { name: 'Minimal' };
    const result = buildSpecHtml(minimal, []);
    expect(result).not.toContain('class="doc-meta"');
  });

  it('includes only provided meta fields (partial)', () => {
    const partial: ExportProject = { name: 'Partial', number: 'P-01' };
    const result = buildSpecHtml(partial, []);
    expect(result).toContain('P-01');
    expect(result).not.toContain('undefined');
    expect(result).not.toContain('null');
  });

  it('includes a print bar with project name', () => {
    const result = buildSpecHtml(project, sections);
    expect(result).toContain('class="print-bar"');
  });

  it('includes window.print() call in print button', () => {
    const result = buildSpecHtml(project, sections);
    expect(result).toContain('window.print()');
  });

  it('includes @media print styles', () => {
    const result = buildSpecHtml(project, sections);
    expect(result).toContain('@media print');
  });

  it('includes A4 page width', () => {
    const result = buildSpecHtml(project, sections);
    expect(result).toContain('210mm');
  });

  it('handles empty sections array', () => {
    const result = buildSpecHtml(project, []);
    expect(result).toContain('<!DOCTYPE html>');
    expect(result).toContain('Test Project');
  });

  it('renders multiple sections', () => {
    const multi: ExportSection[] = [
      { code: '01', title: 'Section One', clauses: [{ code: '01.01', title: 'A', resolvedBody: 'Body A' }] },
      { code: '02', title: 'Section Two', clauses: [{ code: '02.01', title: 'B', resolvedBody: 'Body B' }] },
    ];
    const result = buildSpecHtml(project, multi);
    expect(result).toContain('Section One');
    expect(result).toContain('Section Two');
    expect(result).toContain('Body A');
    expect(result).toContain('Body B');
  });

  it('includes a document footer', () => {
    const result = buildSpecHtml(project, sections);
    expect(result).toContain('class="doc-footer"');
    expect(result).toContain('Generated by Spec Writer');
  });

  it('includes project number in footer when present', () => {
    const result = buildSpecHtml(project, sections);
    // Footer should contain number
    const footerStart = result.indexOf('class="doc-footer"');
    expect(footerStart).toBeGreaterThan(-1);
    const footerSnippet = result.slice(footerStart, footerStart + 300);
    expect(footerSnippet).toContain('TP-001');
  });

  it('uses clause-code class for monospace code display', () => {
    const result = buildSpecHtml(project, sections);
    expect(result).toContain('class="clause-code"');
  });

  it('converts newlines in plain-text body to <br>', () => {
    const multiline: ExportSection[] = [
      { code: '01', title: 'S', clauses: [{ code: '01.01', title: 'T', resolvedBody: 'Line 1\nLine 2' }] },
    ];
    const result = buildSpecHtml(project, multiline);
    expect(result).toContain('<br>');
  });
});
