export interface ExportClause {
  code: string;
  title: string;
  resolvedBody: string;
}

export interface ExportSection {
  code: string;
  title: string;
  clauses: ExportClause[];
}

export interface ExportProject {
  name: string;
  number?: string | null;
  client?: string | null;
  address?: string | null;
}

export { buildSpecHtml } from './html/index.js';
export { buildSpecPdf } from './pdf/index.js';
export { buildSpecDocx } from './docx/index.js';
export { buildSpecJson } from './json/index.js';
export type { SpecJson } from './json/index.js';
