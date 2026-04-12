'use client';

import { stripHtml } from '../../lib/strip-html';

interface ClauseCardResult {
  id: string;
  code: string;
  title: string;
  body: string;
  tags: string[] | null;
  sectionTitle: string;
  sectionCode: string;
}

interface ClauseCardProps {
  clause: ClauseCardResult;
  onToggle?: (clauseId: string) => void;
  checked?: boolean;
  toggling?: boolean;
}

export function ClauseCard({ clause, onToggle, checked, toggling }: ClauseCardProps) {

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 hover:border-blue-200 hover:shadow-sm transition-all">
      <div className="flex items-start justify-between gap-6">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xs font-mono font-medium text-blue-700 bg-blue-50 px-2 py-0.5 rounded">
              {clause.code}
            </span>
            <span className="text-xs text-gray-400">{clause.sectionTitle}</span>
          </div>
          <h3 className="text-sm font-semibold text-gray-900 mb-1.5">{clause.title}</h3>
          <p className="text-sm text-gray-500 line-clamp-3 leading-relaxed">{stripHtml(clause.body)}</p>
          {clause.tags && clause.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-3">
              {clause.tags.map((tag) => (
                <span key={tag} className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>
        {onToggle && (
          <label className="shrink-0 flex items-center gap-2 cursor-pointer select-none" aria-label={checked ? `Remove clause ${clause.code} from project` : `Add clause ${clause.code} to project`}>
            <input
              type="checkbox"
              checked={checked ?? false}
              disabled={toggling}
              onChange={() => onToggle(clause.id)}
              className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 disabled:opacity-50 cursor-pointer"
            />
            <span className={`text-xs font-medium ${checked ? 'text-blue-600' : 'text-gray-400'}`}>
              {toggling ? '…' : checked ? 'Added' : 'Add'}
            </span>
          </label>
        )}
      </div>
    </div>
  );
}
