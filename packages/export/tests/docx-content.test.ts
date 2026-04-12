/**
 * DOCX content inspection tests.
 *
 * A DOCX file is a ZIP archive. We use jszip to unpack it and inspect the
 * word/document.xml file, which contains all body text as Open XML markup.
 * This lets us verify that project names, section headings, and clause codes
 * actually appear in the generated document — not just that the buffer has
 * the correct magic bytes.
 */
import { describe, it, expect } from 'vitest';
import JSZip from 'jszip';
import { buildSpecDocx } from '../src/docx/index.js';
import type { ExportProject, ExportSection } from '../src/index.js';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Unzip the DOCX buffer and return the word/document.xml content as a string. */
async function getDocumentXml(buf: Buffer): Promise<string> {
  const zip = await JSZip.loadAsync(buf);
  const file = zip.file('word/document.xml');
  if (!file) throw new Error('word/document.xml not found in DOCX');
  return file.async('string');
}

/** List all file paths inside the ZIP. */
async function listZipFiles(buf: Buffer): Promise<string[]> {
  const zip = await JSZip.loadAsync(buf);
  return Object.keys(zip.files);
}

/** Get [Content_Types].xml to verify DOCX structure. */
async function getContentTypes(buf: Buffer): Promise<string> {
  const zip = await JSZip.loadAsync(buf);
  const file = zip.file('[Content_Types].xml');
  if (!file) throw new Error('[Content_Types].xml not found');
  return file.async('string');
}

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const project: ExportProject = {
  name: 'Harrington Tower',
  number: 'HT-042',
  client: 'Harrington Developments',
  address: '42 Anzac Parade',
};

const sections: ExportSection[] = [
  {
    code: '01',
    title: 'General Requirements',
    clauses: [
      { code: '01.01', title: 'Scope of Works', resolvedBody: 'All work shall conform to this specification.' },
      { code: '01.02', title: 'Referenced Standards', resolvedBody: '<p>Refer to AS 1170 and AS 4600.</p>' },
    ],
  },
  {
    code: '03',
    title: 'Concrete',
    clauses: [
      { code: '03.01', title: 'Mix Design', resolvedBody: '<ul><li>Normal-class concrete N32</li><li>Minimum 28-day strength</li></ul>' },
    ],
  },
];

// ---------------------------------------------------------------------------
// ZIP structure
// ---------------------------------------------------------------------------

describe('DOCX ZIP structure', () => {
  it('contains word/document.xml', async () => {
    const buf = await buildSpecDocx(project, sections);
    const files = await listZipFiles(buf);
    expect(files).toContain('word/document.xml');
  });

  it('contains word/styles.xml', async () => {
    const buf = await buildSpecDocx(project, sections);
    const files = await listZipFiles(buf);
    expect(files).toContain('word/styles.xml');
  });

  it('contains [Content_Types].xml', async () => {
    const buf = await buildSpecDocx(project, sections);
    const files = await listZipFiles(buf);
    expect(files).toContain('[Content_Types].xml');
  });

  it('contains _rels/.rels', async () => {
    const buf = await buildSpecDocx(project, sections);
    const files = await listZipFiles(buf);
    expect(files).toContain('_rels/.rels');
  });

  it('[Content_Types].xml declares DOCX document content type', async () => {
    const buf = await buildSpecDocx(project, sections);
    const ct = await getContentTypes(buf);
    expect(ct).toContain('wordprocessingml.document.main');
  });
}, 30_000);

// ---------------------------------------------------------------------------
// Document content (word/document.xml)
// ---------------------------------------------------------------------------

describe('DOCX document content', () => {
  it('contains project name in document body', async () => {
    const buf = await buildSpecDocx(project, sections);
    const xml = await getDocumentXml(buf);
    expect(xml).toContain('Harrington Tower');
  });

  it('contains project number in document body', async () => {
    const buf = await buildSpecDocx(project, sections);
    const xml = await getDocumentXml(buf);
    expect(xml).toContain('HT-042');
  });

  it('contains client name', async () => {
    const buf = await buildSpecDocx(project, sections);
    const xml = await getDocumentXml(buf);
    expect(xml).toContain('Harrington Developments');
  });

  it('contains section title text (uppercased by builder)', async () => {
    // The DOCX builder applies .toUpperCase() to section headings
    const buf = await buildSpecDocx(project, sections);
    const xml = await getDocumentXml(buf);
    expect(xml).toContain('GENERAL REQUIREMENTS');
  });

  it('contains second section title (uppercased)', async () => {
    const buf = await buildSpecDocx(project, sections);
    const xml = await getDocumentXml(buf);
    expect(xml).toContain('CONCRETE');
  });

  it('contains clause title text', async () => {
    const buf = await buildSpecDocx(project, sections);
    const xml = await getDocumentXml(buf);
    expect(xml).toContain('Scope of Works');
  });

  it('contains clause code', async () => {
    const buf = await buildSpecDocx(project, sections);
    const xml = await getDocumentXml(buf);
    expect(xml).toContain('01.01');
  });

  it('contains clause body plain text (stripped from HTML)', async () => {
    const buf = await buildSpecDocx(project, sections);
    const xml = await getDocumentXml(buf);
    expect(xml).toContain('All work shall conform to this specification');
  });

  it('contains list item text from HTML ul/li', async () => {
    const buf = await buildSpecDocx(project, sections);
    const xml = await getDocumentXml(buf);
    expect(xml).toContain('Normal-class concrete N32');
    expect(xml).toContain('Minimum 28-day strength');
  });

  it('does not contain raw HTML tags in body text', async () => {
    const htmlSections: ExportSection[] = [{
      code: '01',
      title: 'Section',
      clauses: [{ code: '01.01', title: 'T', resolvedBody: '<p>Plain text paragraph.</p>' }],
    }];
    const buf = await buildSpecDocx(project, htmlSections);
    const xml = await getDocumentXml(buf);
    // The XML will have its own <w:t> tags etc., but should NOT have raw <p> tags from the clause body
    // We check the clause text is present without its original HTML wrapper
    expect(xml).toContain('Plain text paragraph');
    // Raw <p> should not survive as-is into the w:t content
    expect(xml).not.toMatch(/<p>Plain text paragraph/);
  });

  it('document with minimal project only contains project name', async () => {
    const minimal: ExportProject = { name: 'Minimal Build' };
    const buf = await buildSpecDocx(minimal, []);
    const xml = await getDocumentXml(buf);
    expect(xml).toContain('Minimal Build');
  });

  it('does not contain undefined or null as literal text', async () => {
    const partial: ExportProject = { name: 'Partial', number: 'P-01' };
    const buf = await buildSpecDocx(partial, []);
    const xml = await getDocumentXml(buf);
    expect(xml).not.toContain('>undefined<');
    expect(xml).not.toContain('>null<');
    expect(xml).not.toContain('undefined</');
    expect(xml).not.toContain('null</');
  });

  it('contains bold formatting runs for clause titles (w:b element)', async () => {
    const buf = await buildSpecDocx(project, sections);
    const xml = await getDocumentXml(buf);
    // Word bold is represented as <w:b/> in run properties
    expect(xml).toMatch(/<w:b[\s/>]/);
  });

  it('contains address text when provided', async () => {
    const buf = await buildSpecDocx(project, sections);
    const xml = await getDocumentXml(buf);
    expect(xml).toContain('42 Anzac Parade');
  });
}, 30_000);

// ---------------------------------------------------------------------------
// Inline formatting in content
// ---------------------------------------------------------------------------

describe('DOCX inline formatting', () => {
  it('bold clause body text produces w:b run property', async () => {
    const boldSections: ExportSection[] = [{
      code: '01',
      title: 'Section',
      clauses: [{ code: '01.01', title: 'T', resolvedBody: '<p>Normal <strong>critical requirement</strong> text.</p>' }],
    }];
    const buf = await buildSpecDocx(project, boldSections);
    const xml = await getDocumentXml(buf);
    expect(xml).toContain('critical requirement');
    expect(xml).toMatch(/<w:b[\s/>]/);
  });

  it('italic clause body text produces w:i run property', async () => {
    const italicSections: ExportSection[] = [{
      code: '01',
      title: 'Section',
      clauses: [{ code: '01.01', title: 'T', resolvedBody: '<p>See <em>note below</em> for details.</p>' }],
    }];
    const buf = await buildSpecDocx(project, italicSections);
    const xml = await getDocumentXml(buf);
    expect(xml).toContain('note below');
    expect(xml).toMatch(/<w:i[\s/>]/);
  });
}, 30_000);
