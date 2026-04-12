import puppeteer from 'puppeteer';
import type { ExportProject, ExportSection } from '../index.js';
import { buildSpecHtml } from '../html/index.js';

export async function buildSpecPdf(project: ExportProject, sections: ExportSection[]): Promise<Buffer> {
  const html = buildSpecHtml(project, sections);

  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  try {
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'networkidle0' });

    const pdf = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: { top: '20mm', right: '20mm', bottom: '20mm', left: '20mm' },
    });

    return Buffer.from(pdf);
  } finally {
    await browser.close();
  }
}
