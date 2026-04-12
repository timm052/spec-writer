'use client';

import { cn } from '../../lib/utils';

interface SidebarSection {
  id: string;
  code: string;
  title: string;
  clauseCount: number;
  reviewedCount: number;
}

interface SectionSidebarProps {
  sections: SidebarSection[];
  activeSectionId?: string;
  onSelectSection: (id: string) => void;
}

export function SectionSidebar({ sections, activeSectionId, onSelectSection }: SectionSidebarProps) {
  const totalClauses = sections.reduce((n, s) => n + s.clauseCount, 0);
  const totalReviewed = sections.reduce((n, s) => n + s.reviewedCount, 0);
  const pct = totalClauses > 0 ? Math.round((totalReviewed / totalClauses) * 100) : 0;

  function scrollToSection(id: string) {
    onSelectSection(id);
    const el = document.getElementById(`section-${id}`);
    el?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  return (
    <nav aria-label="Specification sections">
      {/* Completeness bar */}
      {totalClauses > 0 && (
        <div className="mb-4">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs text-gray-500">Review progress</span>
            <span className="text-xs font-medium text-gray-700">{pct}%</span>
          </div>
          <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
            <div
              className={cn(
                'h-full rounded-full transition-all',
                pct === 100 ? 'bg-green-500' : pct >= 50 ? 'bg-blue-500' : 'bg-gray-300',
              )}
              // eslint-disable-next-line react/forbid-dom-props -- dynamic progress width requires inline style
            style={{ width: `${pct}%` }}
              role="progressbar"
              aria-label={`${pct}% of clauses reviewed or approved`}
            />
          </div>
          <p className="text-xs text-gray-400 mt-0.5">{totalReviewed} / {totalClauses} clauses reviewed or approved</p>
        </div>
      )}

      <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Sections</h3>
      <ul className="space-y-1">
        {sections.map((section) => (
          <li key={section.id}>
            <button
              className={cn(
                'w-full text-left px-3 py-2 text-sm rounded-md transition-colors',
                activeSectionId === section.id
                  ? 'bg-blue-100 text-blue-800 font-medium'
                  : 'text-gray-700 hover:bg-gray-100',
              )}
              onClick={() => scrollToSection(section.id)}
              aria-current={activeSectionId === section.id ? 'location' : undefined}
            >
              <span className="font-mono text-xs text-gray-400 mr-1">{section.code}</span>
              {section.title}
              {section.clauseCount > 0 && (
                <span className="ml-1 text-xs text-gray-400">
                  ({section.reviewedCount}/{section.clauseCount})
                </span>
              )}
            </button>
          </li>
        ))}
      </ul>
    </nav>
  );
}
