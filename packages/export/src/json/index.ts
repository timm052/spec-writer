import type { ExportProject, ExportSection } from '../index.js';

export interface SpecJson {
  project: ExportProject;
  exportedAt: string;
  clauseCount: number;
  sections: ExportSection[];
}

export function buildSpecJson(project: ExportProject, sections: ExportSection[]): SpecJson {
  const clauseCount = sections.reduce((n, s) => n + s.clauses.length, 0);

  return {
    project,
    exportedAt: new Date().toISOString(),
    clauseCount,
    sections,
  };
}
