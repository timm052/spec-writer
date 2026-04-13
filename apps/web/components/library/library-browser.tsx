'use client';

import { useState, useEffect, useCallback } from 'react';
import { Input, Spinner } from '../shared';
import { SectionTree } from './section-tree';
import { ClauseCard } from './clause-card';
import type { Section } from '@spec-writer/db';

interface LibraryClause {
  id: string;
  code: string;
  title: string;
  body: string;
  tags: string[] | null;
  sectionTitle: string;
  sectionCode: string;
}

interface LibraryBrowserProps {
  sections: Section[];
  projectId?: string;
  availableTags?: string[];
  onClauseAdded?: () => void;
  activeSetId?: string;
}

export function LibraryBrowser({ sections, projectId, availableTags, onClauseAdded, activeSetId }: LibraryBrowserProps) {
  const [query, setQuery] = useState('');
  const [selectedSection, setSelectedSection] = useState<string | undefined>();
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [clauses, setClauses] = useState<LibraryClause[]>([]);
  const [loading, setLoading] = useState(true);
  const [togglingClauseId, setTogglingClauseId] = useState<string | null>(null);
  // Maps clauseId → projectClauseId for every included clause
  const [addedMap, setAddedMap] = useState<Map<string, string>>(new Map());

  // Reset section filter when the active set changes
  useEffect(() => {
    setSelectedSection(undefined);
  }, [activeSetId]);

  // Fetch the project's current clause state whenever projectId changes
  useEffect(() => {
    if (!projectId) return;
    void (async () => {
      try {
        const res = await fetch(`/api/projects/${projectId}/spec`);
        if (!res.ok) return;
        const data = await res.json() as {
          sections: Array<{
            clauses: Array<{ clauseId: string; projectClauseId: string; included: boolean }>;
          }>;
        };
        const map = new Map<string, string>();
        for (const section of data.sections) {
          for (const clause of section.clauses) {
            if (clause.included) {
              map.set(clause.clauseId, clause.projectClauseId);
            }
          }
        }
        setAddedMap(map);
      } catch {
        // silently ignore — addedMap stays empty
      }
    })();
  }, [projectId]);

  const fetchClauses = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (query) params.set('q', query);
    if (selectedSection) params.set('section', selectedSection);
    if (selectedTags.length > 0) params.set('tags', selectedTags.join(','));
    if (activeSetId) params.set('setId', activeSetId);
    try {
      const res = await fetch(`/api/library/clauses?${params}`);
      if (res.ok) {
        const data = await res.json() as LibraryClause[];
        setClauses(data);
      }
    } finally {
      setLoading(false);
    }
  }, [query, selectedSection, selectedTags, activeSetId]);

  useEffect(() => {
    const timer = setTimeout(() => { void fetchClauses(); }, 200);
    return () => clearTimeout(timer);
  }, [fetchClauses]);

  async function handleToggle(clauseId: string) {
    if (!projectId) return;
    setTogglingClauseId(clauseId);
    try {
      const projectClauseId = addedMap.get(clauseId);
      if (projectClauseId) {
        // Already in project — remove it
        await fetch(`/api/projects/${projectId}/clauses/${projectClauseId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ included: false }),
        });
        setAddedMap((prev) => {
          const next = new Map(prev);
          next.delete(clauseId);
          return next;
        });
      } else {
        // Not in project — add it
        const res = await fetch(`/api/projects/${projectId}/clauses`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ clauseId }),
        });
        if (res.ok) {
          const data = await res.json() as { id: string };
          setAddedMap((prev) => new Map(prev).set(clauseId, data.id));
          onClauseAdded?.();
        }
      }
    } finally {
      setTogglingClauseId(null);
    }
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
      {/* Section tree */}
      <aside className="lg:col-span-1">
        <div className="bg-white rounded-xl border border-gray-200 p-5 sticky top-20 space-y-6">
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-4">Sections</p>
            <SectionTree
              sections={sections}
              selectedSectionId={selectedSection}
              onSelectSection={setSelectedSection}
            />
          </div>
          {availableTags && availableTags.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Tags</p>
              <div className="flex flex-wrap gap-1.5">
                {availableTags.map((tag) => {
                  const active = selectedTags.includes(tag);
                  return (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => setSelectedTags((prev) =>
                        active ? prev.filter((t) => t !== tag) : [...prev, tag]
                      )}
                      className={`text-xs px-2.5 py-1 rounded-full border transition-colors ${
                        active
                          ? 'bg-blue-600 text-white border-blue-600'
                          : 'bg-white text-gray-500 border-gray-200 hover:border-blue-300 hover:text-blue-600'
                      }`}
                    >
                      {tag}
                    </button>
                  );
                })}
              </div>
              {selectedTags.length > 0 && (
                <button
                  type="button"
                  onClick={() => setSelectedTags([])}
                  className="mt-2 text-xs text-gray-400 hover:text-gray-600"
                >
                  Clear tags
                </button>
              )}
            </div>
          )}
        </div>
      </aside>

      {/* Results */}
      <div className="lg:col-span-3">
        <div className="mb-6">
          <Input
            type="search"
            placeholder="Search by title, code or body text…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            aria-label="Search clauses"
          />
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <Spinner size="lg" />
          </div>
        ) : clauses.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-xl border border-gray-200">
            <p className="text-gray-400 text-sm">No clauses found.</p>
          </div>
        ) : (
          <>
            <p className="text-xs text-gray-400 mb-4">{clauses.length} clause{clauses.length === 1 ? '' : 's'}</p>
            <div className="space-y-3">
              {clauses.map((clause) => (
                <ClauseCard
                  key={clause.id}
                  clause={clause}
                  onToggle={projectId ? handleToggle : undefined}
                  checked={addedMap.has(clause.id)}
                  toggling={togglingClauseId === clause.id}
                />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
