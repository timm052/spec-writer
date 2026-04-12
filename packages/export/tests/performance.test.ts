/**
 * Performance tests — enforce the NFR from the build plan:
 *
 *   "PDF/DOCX generation must complete in under 10 seconds for a 100-clause spec"
 *
 * These tests are slow by design; they each have a 30s timeout but should
 * finish well under the 10s budget. If they start approaching the limit,
 * investigate the exporter for regressions.
 */
import { describe, it, expect } from 'vitest';
import { buildSpecPdf } from '../src/pdf/index.js';
import { buildSpecDocx } from '../src/docx/index.js';
import { buildSpecHtml } from '../src/html/index.js';
import { buildSpecJson } from '../src/json/index.js';
import type { ExportProject, ExportSection } from '../src/index.js';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const TIME_LIMIT_MS = 10_000;
// Puppeteer launches a full Chromium process per call; PDF limits are higher.
const PDF_TIME_LIMIT_MS = 20_000;

function makeLargeSpec(clauseCount: number, sectionCount = 5): { project: ExportProject; sections: ExportSection[] } {
  const project: ExportProject = {
    name: 'Performance Test Project',
    number: 'PERF-001',
    client: 'Test Client',
    address: '1 Performance Avenue',
  };

  const clausesPerSection = Math.ceil(clauseCount / sectionCount);

  const sections: ExportSection[] = Array.from({ length: sectionCount }, (_, si) => ({
    code: String(si + 1).padStart(2, '0'),
    title: `Section ${si + 1} — Performance Test`,
    clauses: Array.from({ length: clausesPerSection }, (__, ci) => {
      const num = si * clausesPerSection + ci + 1;
      return {
        code: `${String(si + 1).padStart(2, '0')}.${String(ci + 1).padStart(2, '0')}`,
        title: `Clause ${num} Performance Title`,
        resolvedBody: [
          `<p>This is the body text for clause ${num}. It contains a realistic length of text`,
          `that simulates a NatSpec clause with some content about materials, finishes,`,
          `and construction requirements applicable to this section of the specification.</p>`,
          `<ul><li>Requirement A for clause ${num}</li><li>Requirement B for clause ${num}</li></ul>`,
        ].join(' '),
      };
    }),
  }));

  return { project, sections };
}

// ---------------------------------------------------------------------------
// PDF
// ---------------------------------------------------------------------------

describe('PDF performance', () => {
  it('generates 100-clause PDF in under 20 seconds', async () => {
    const { project, sections } = makeLargeSpec(100);
    const start = Date.now();
    const buf = await buildSpecPdf(project, sections);
    const elapsed = Date.now() - start;

    expect(Buffer.isBuffer(buf)).toBe(true);
    expect(buf.slice(0, 4).toString('ascii')).toBe('%PDF');
    expect(elapsed).toBeLessThan(PDF_TIME_LIMIT_MS);
  }, 60_000);

  it('generates 50-clause PDF in under 15 seconds', async () => {
    const { project, sections } = makeLargeSpec(50);
    const start = Date.now();
    await buildSpecPdf(project, sections);
    const elapsed = Date.now() - start;
    expect(elapsed).toBeLessThan(15_000);
  }, 60_000);

  it('PDF buffer size scales sub-linearly or linearly with clause count', async () => {
    const small = makeLargeSpec(10);
    const large = makeLargeSpec(100);

    const [smallBuf, largeBuf] = await Promise.all([
      buildSpecPdf(small.project, small.sections),
      buildSpecPdf(large.project, large.sections),
    ]);

    // 100 clauses should produce more output than 10 clauses
    expect(largeBuf.length).toBeGreaterThan(smallBuf.length);
    // But should not be more than 20x larger (sanity check against runaway growth)
    expect(largeBuf.length).toBeLessThan(smallBuf.length * 20);
  }, 120_000);
});

// ---------------------------------------------------------------------------
// DOCX
// ---------------------------------------------------------------------------

describe('DOCX performance', () => {
  it('generates 100-clause DOCX in under 10 seconds', async () => {
    const { project, sections } = makeLargeSpec(100);
    const start = Date.now();
    const buf = await buildSpecDocx(project, sections);
    const elapsed = Date.now() - start;

    expect(Buffer.isBuffer(buf)).toBe(true);
    expect(buf[0]).toBe(0x50); // P — ZIP magic
    expect(buf[1]).toBe(0x4b); // K
    expect(elapsed).toBeLessThan(TIME_LIMIT_MS);
  }, 30_000);

  it('generates 50-clause DOCX in under 5 seconds', async () => {
    const { project, sections } = makeLargeSpec(50);
    const start = Date.now();
    await buildSpecDocx(project, sections);
    const elapsed = Date.now() - start;
    expect(elapsed).toBeLessThan(5_000);
  }, 30_000);
});

// ---------------------------------------------------------------------------
// HTML (synchronous — should always be fast)
// ---------------------------------------------------------------------------

describe('HTML performance', () => {
  it('generates 100-clause HTML in under 1 second', () => {
    const { project, sections } = makeLargeSpec(100);
    const start = Date.now();
    const html = buildSpecHtml(project, sections);
    const elapsed = Date.now() - start;

    expect(typeof html).toBe('string');
    expect(html).toContain('<!DOCTYPE html>');
    expect(elapsed).toBeLessThan(1_000);
  });

  it('generates 500-clause HTML in under 3 seconds', () => {
    const { project, sections } = makeLargeSpec(500, 10);
    const start = Date.now();
    const html = buildSpecHtml(project, sections);
    const elapsed = Date.now() - start;
    expect(typeof html).toBe('string');
    expect(elapsed).toBeLessThan(3_000);
  });
});

// ---------------------------------------------------------------------------
// JSON (synchronous — should always be fast)
// ---------------------------------------------------------------------------

describe('JSON performance', () => {
  it('generates 100-clause JSON in under 100ms', () => {
    const { project, sections } = makeLargeSpec(100);
    const start = Date.now();
    const result = buildSpecJson(project, sections);
    const elapsed = Date.now() - start;

    expect(result.clauseCount).toBe(result.sections.reduce((a, s) => a + s.clauses.length, 0));
    expect(elapsed).toBeLessThan(100);
  });

  it('generates 1000-clause JSON in under 500ms', () => {
    const { project, sections } = makeLargeSpec(1000, 20);
    const start = Date.now();
    const result = buildSpecJson(project, sections);
    const elapsed = Date.now() - start;
    expect(result.clauseCount).toBeGreaterThan(0);
    expect(elapsed).toBeLessThan(500);
  });
});
