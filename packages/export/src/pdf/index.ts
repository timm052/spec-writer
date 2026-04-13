import os from 'os';
import path from 'path';
import fs from 'fs';
import puppeteer, { type Browser } from 'puppeteer';
import type { ExportProject, ExportSection } from '../index.js';
import { buildSpecHtml } from '../html/index.js';

// Fixed profile dir so we can predictably clear stale locks on restart.
const CHROME_DATA_DIR = path.join(os.tmpdir(), 'spec_writer_chrome');

// Singleton browser — launch once, reuse across requests.
let _browser: Browser | null = null;

async function getBrowser(): Promise<Browser> {
  if (_browser) {
    try {
      await _browser.version();
      return _browser;
    } catch {
      _browser = null;
    }
  }

  // On Windows, Chrome writes a 'lockfile' inside the userDataDir while
  // running. Puppeteer checks for this file and throws "browser already
  // running" if it exists. If the previous Node process was killed (e.g.
  // Next.js HMR restart) Chrome may not have cleaned this up — delete it.
  const chromeLockfile = path.join(CHROME_DATA_DIR, 'lockfile');
  try { fs.rmSync(chromeLockfile, { force: true }); } catch { /* ignore */ }
  // Linux/macOS equivalent
  const singletonLock = path.join(CHROME_DATA_DIR, 'SingletonLock');
  try { fs.rmSync(singletonLock, { force: true }); } catch { /* ignore */ }

  _browser = await puppeteer.launch({
    headless: true,
    userDataDir: CHROME_DATA_DIR,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-gpu',
    ],
  });
  return _browser;
}

export async function buildSpecPdf(project: ExportProject, sections: ExportSection[]): Promise<Buffer> {
  const html = buildSpecHtml(project, sections);
  const browser = await getBrowser();
  const page = await browser.newPage();
  try {
    await page.setContent(html, { waitUntil: 'networkidle0' });
    const pdf = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: { top: '20mm', right: '20mm', bottom: '20mm', left: '20mm' },
    });
    return Buffer.from(pdf);
  } finally {
    await page.close();
  }
}
