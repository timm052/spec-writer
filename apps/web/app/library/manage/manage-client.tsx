'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Button, Input, Label, Textarea } from '../../../components/shared';
import { ClauseSetSelector } from '../../../components/library/clause-set-selector';
import { toast } from '../../../lib/toast';
import type { Section, ClauseSet } from '@spec-writer/db';

type ClauseSource = 'natspec' | 'practice' | 'project';

interface LibraryClause {
  id: string;
  code: string;
  title: string;
  body: string;
  tags: string[] | null;
  source: ClauseSource;
  sectionId: string;
  sectionTitle: string;
  sectionCode: string;
}

interface ClauseFormState {
  clauseId: string | null; // null = create, string = edit
  sectionId: string;
  code: string;
  title: string;
  body: string;
  tags: string;
  source: ClauseSource;
}

const EMPTY_FORM: ClauseFormState = {
  clauseId: null,
  sectionId: '',
  code: '',
  title: '',
  body: '',
  tags: '',
  source: 'practice',
};

const SOURCE_LABELS: Record<ClauseSource, string> = {
  natspec: 'NatSpec',
  practice: 'Practice',
  project: 'Project',
};

interface LibraryManageClientProps {
  initialSections: Section[];
  clauseSets: ClauseSet[];
  activeSetId: string;
}

export function LibraryManageClient({ initialSections, clauseSets, activeSetId }: LibraryManageClientProps) {
  const [sections, setSections] = useState<Section[]>(initialSections);
  const [selectedSection, setSelectedSection] = useState<string | undefined>(initialSections[0]?.id);
  const [clauses, setClauses] = useState<LibraryClause[]>([]);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState<ClauseFormState | null>(null);
  const [saving, setSaving] = useState(false);
  const [sourceFilter, setSourceFilter] = useState<ClauseSource | ''>('');

  // Section form
  const [showSectionForm, setShowSectionForm] = useState(false);
  const [sectionCode, setSectionCode] = useState('');
  const [sectionTitle, setSectionTitle] = useState('');

  // Import
  const [showImport, setShowImport] = useState(false);
  const [importJson, setImportJson] = useState('');
  const [importing, setImporting] = useState(false);

  // Sync sections state when the server-rendered prop changes (clause set switch)
  useEffect(() => {
    setSections(initialSections);
    setSelectedSection(initialSections[0]?.id);
    setClauses([]);
  }, [initialSections]);

  const fetchClauses = useCallback(async () => {
    if (!selectedSection) return;
    setLoading(true);
    try {
      const params = new URLSearchParams({ section: selectedSection });
      if (sourceFilter) params.set('source', sourceFilter);
      const res = await fetch(`/api/library/clauses?${params}`);
      if (res.ok) setClauses(await res.json() as LibraryClause[]);
    } finally {
      setLoading(false);
    }
  }, [selectedSection, sourceFilter]);

  useEffect(() => { void fetchClauses(); }, [fetchClauses]);

  function openCreate() {
    setForm({ ...EMPTY_FORM, sectionId: selectedSection ?? '' });
  }

  function openEdit(clause: LibraryClause) {
    setForm({
      clauseId: clause.id,
      sectionId: clause.sectionId,
      code: clause.code,
      title: clause.title,
      body: clause.body,
      tags: (clause.tags ?? []).join(', '),
      source: clause.source,
    });
  }

  async function handleSaveClause() {
    if (!form) return;
    setSaving(true);
    try {
      const payload = {
        sectionId: form.sectionId,
        code: form.code,
        title: form.title,
        body: form.body,
        tags: form.tags.split(',').map((t) => t.trim()).filter(Boolean),
        source: form.source,
      };
      const isEdit = form.clauseId !== null;
      const res = await fetch(
        isEdit ? `/api/library/clauses/${form.clauseId}` : '/api/library/clauses',
        {
          method: isEdit ? 'PATCH' : 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        },
      );
      if (!res.ok) { toast('Failed to save clause', 'error'); return; }
      toast(isEdit ? 'Clause updated' : 'Clause created');
      setForm(null);
      void fetchClauses();
    } finally {
      setSaving(false);
    }
  }

  async function handleDeleteClause(id: string, title: string) {
    if (!confirm(`Delete clause "${title}"? This cannot be undone.`)) return;
    const res = await fetch(`/api/library/clauses/${id}`, { method: 'DELETE' });
    if (res.ok) {
      setClauses((prev) => prev.filter((c) => c.id !== id));
      toast('Clause deleted');
    } else {
      toast('Failed to delete clause', 'error');
    }
  }

  async function handleCreateSection() {
    if (!sectionCode.trim() || !sectionTitle.trim()) return;
    const res = await fetch('/api/library/sections', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ clauseSetId: activeSetId, code: sectionCode.trim(), title: sectionTitle.trim() }),
    });
    if (!res.ok) { toast('Failed to create section', 'error'); return; }
    const section = await res.json() as Section;
    setSections((prev) => [...prev, section]);
    setSelectedSection(section.id);
    setSectionCode('');
    setSectionTitle('');
    setShowSectionForm(false);
    toast('Section created');
  }

  async function handleDeleteSection(id: string, title: string) {
    if (!confirm(`Delete section "${title}" and all its clauses? This cannot be undone.`)) return;
    const res = await fetch(`/api/library/sections/${id}`, { method: 'DELETE' });
    if (res.ok) {
      setSections((prev) => prev.filter((s) => s.id !== id));
      if (selectedSection === id) setSelectedSection(sections.find((s) => s.id !== id)?.id);
      toast('Section deleted');
    } else {
      toast('Failed to delete section', 'error');
    }
  }

  async function handleImport() {
    setImporting(true);
    try {
      let data: unknown;
      try { data = JSON.parse(importJson); } catch {
        toast('Invalid JSON', 'error'); return;
      }
      const res = await fetch('/api/library/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clauseSetId: activeSetId, sections: data }),
      });
      if (!res.ok) { toast('Import failed', 'error'); return; }
      const result = await res.json() as { sectionsCreated: number; clausesCreated: number };
      toast(`Imported ${result.clausesCreated} clauses across ${result.sectionsCreated} new sections`);
      // Refresh sections list for this set
      const sectRes = await fetch(`/api/library/sections?setId=${activeSetId}`);
      if (sectRes.ok) setSections(await sectRes.json() as Section[]);
      setImportJson('');
      setShowImport(false);
      void fetchClauses();
    } finally {
      setImporting(false);
    }
  }

  const currentSection = sections.find((s) => s.id === selectedSection);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Header */}
      <div className="flex items-center justify-between mb-6 gap-4 flex-wrap">
        <div>
          <Link href="/library" className="text-xs text-gray-400 hover:text-gray-600 mb-1 inline-block">← Library</Link>
          <h1 className="text-2xl font-bold text-gray-900">Manage Library</h1>
          <p className="text-sm text-gray-500 mt-0.5">Edit sections, clauses, and import specifications</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="secondary" size="sm" onClick={() => setShowImport(true)}>
            Import JSON
          </Button>
          <Button size="sm" onClick={openCreate} disabled={!selectedSection}>
            + New Clause
          </Button>
        </div>
      </div>

      {clauseSets.length > 0 && (
        <div className="mb-8">
          <ClauseSetSelector
            clauseSets={clauseSets}
            activeSetId={activeSetId}
            basePath="/library/manage"
          />
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Section list */}
        <aside className="lg:col-span-1">
          <div className="bg-white rounded-xl border border-gray-200 p-4 sticky top-20">
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Sections</p>
              <button
                type="button"
                onClick={() => setShowSectionForm((v) => !v)}
                className="text-xs text-blue-600 hover:underline"
                aria-label="Add new section"
              >
                + Add
              </button>
            </div>

            {showSectionForm && (
              <div className="mb-3 space-y-2 p-3 bg-gray-50 rounded-lg border border-gray-100">
                <Input
                  value={sectionCode}
                  onChange={(e) => setSectionCode(e.target.value)}
                  placeholder="Code (e.g. 03)"
                  className="text-sm"
                  aria-label="New section code"
                />
                <Input
                  value={sectionTitle}
                  onChange={(e) => setSectionTitle(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') void handleCreateSection(); }}
                  placeholder="Title (e.g. Concrete)"
                  className="text-sm"
                  aria-label="New section title"
                />
                <div className="flex gap-2">
                  <Button size="sm" onClick={() => { void handleCreateSection(); }} className="flex-1">Save</Button>
                  <Button size="sm" variant="ghost" onClick={() => setShowSectionForm(false)}>Cancel</Button>
                </div>
              </div>
            )}

            <ul className="space-y-1">
              {sections.map((s) => (
                <li key={s.id} className="group flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => setSelectedSection(s.id)}
                    className={`flex-1 text-left px-2 py-1.5 rounded text-sm transition-colors ${
                      selectedSection === s.id
                        ? 'bg-blue-50 text-blue-800 font-medium'
                        : 'text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <span className="font-mono text-xs text-gray-400 mr-1">{s.code}</span>
                    {s.title}
                  </button>
                  <button
                    type="button"
                    onClick={() => { void handleDeleteSection(s.id, s.title); }}
                    className="opacity-0 group-hover:opacity-100 text-gray-300 hover:text-red-500 px-1 text-sm transition-opacity"
                    aria-label={`Delete section ${s.title}`}
                  >
                    ×
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </aside>

        {/* Clause list */}
        <div className="lg:col-span-3">
          {/* Empty set — prompt to add a section first */}
          {sections.length === 0 ? (
            <div className="bg-white rounded-xl border border-dashed border-gray-300 p-12 text-center">
              <p className="text-sm font-medium text-gray-700 mb-1">This clause set has no sections yet.</p>
              <p className="text-xs text-gray-400 mb-4">Add a section using the panel on the left, then create clauses within it.</p>
              <Button size="sm" variant="secondary" onClick={() => setShowSectionForm(true)}>
                + Add first section
              </Button>
            </div>
          ) : !selectedSection ? null : (
          <>
          {/* Toolbar */}
          <div className="flex items-center gap-3 mb-5 flex-wrap">
            {currentSection && (
              <h2 className="text-lg font-semibold text-gray-900 flex-1">
                <span className="font-mono text-sm text-gray-400 mr-2">{currentSection.code}</span>
                {currentSection.title}
              </h2>
            )}
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-500">Source:</span>
              {(['', 'natspec', 'practice', 'project'] as const).map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setSourceFilter(s)}
                  aria-label={s === '' ? 'All sources' : SOURCE_LABELS[s]}
                  className={`text-xs px-2.5 py-1 rounded-full border transition-colors ${
                    sourceFilter === s
                      ? 'bg-blue-600 text-white border-blue-600'
                      : 'bg-white text-gray-500 border-gray-200 hover:border-blue-300'
                  }`}
                >
                  {s === '' ? 'All' : SOURCE_LABELS[s]}
                </button>
              ))}
            </div>
          </div>

          {loading ? (
            <p className="text-sm text-gray-400 py-10 text-center">Loading…</p>
          ) : clauses.length === 0 ? (
            <div className="bg-white rounded-xl border border-gray-200 p-10 text-center">
              <p className="text-gray-400 text-sm mb-3">No clauses in this section.</p>
              <Button size="sm" onClick={openCreate}>+ Add first clause</Button>
            </div>
          ) : (
            <div className="space-y-2">
              {clauses.map((clause) => (
                <div
                  key={clause.id}
                  className="bg-white rounded-xl border border-gray-200 p-4 hover:border-blue-200 transition-colors"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className="text-xs font-mono font-medium text-blue-700 bg-blue-50 px-2 py-0.5 rounded">{clause.code}</span>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                          clause.source === 'natspec' ? 'bg-gray-100 text-gray-600' :
                          clause.source === 'practice' ? 'bg-purple-50 text-purple-700' :
                          'bg-orange-50 text-orange-700'
                        }`}>
                          {SOURCE_LABELS[clause.source]}
                        </span>
                      </div>
                      <p className="text-sm font-semibold text-gray-900">{clause.title}</p>
                      {clause.tags && clause.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-1.5">
                          {clause.tags.map((tag) => (
                            <span key={tag} className="text-xs text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded">{tag}</span>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <Button variant="ghost" size="sm" onClick={() => openEdit(clause)} aria-label={`Edit clause ${clause.code}`}>
                        Edit
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => { void handleDeleteClause(clause.id, clause.title); }}
                        className="text-red-500 hover:text-red-700 hover:bg-red-50"
                        aria-label={`Delete clause ${clause.code}`}
                      >
                        Delete
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
          </>
          )}
        </div>
      </div>

      {/* Clause edit/create modal */}
      {form !== null && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-label={form.clauseId ? 'Edit clause' : 'New clause'}>
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">{form.clauseId ? 'Edit Clause' : 'New Clause'}</h2>
              <button type="button" onClick={() => setForm(null)} className="text-gray-400 hover:text-gray-600 text-xl leading-none" aria-label="Close">×</button>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="clause-section" className="text-xs text-gray-600">Section</Label>
                  <select
                    id="clause-section"
                    title="Section"
                    value={form.sectionId}
                    onChange={(e) => setForm((f) => f && ({ ...f, sectionId: e.target.value }))}
                    className="mt-1 w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">— Select section —</option>
                    {sections.map((s) => (
                      <option key={s.id} value={s.id}>{s.code} — {s.title}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <Label htmlFor="clause-source" className="text-xs text-gray-600">Source</Label>
                  <select
                    id="clause-source"
                    title="Source"
                    value={form.source}
                    onChange={(e) => setForm((f) => f && ({ ...f, source: e.target.value as ClauseSource }))}
                    className="mt-1 w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="practice">Practice</option>
                    <option value="natspec">NatSpec</option>
                    <option value="project">Project</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="clause-code" className="text-xs text-gray-600">Code</Label>
                  <Input
                    id="clause-code"
                    value={form.code}
                    onChange={(e) => setForm((f) => f && ({ ...f, code: e.target.value }))}
                    placeholder="e.g. 03.01.02"
                    className="mt-1 font-mono"
                  />
                </div>
                <div className="col-span-2">
                  <Label htmlFor="clause-title" className="text-xs text-gray-600">Title</Label>
                  <Input
                    id="clause-title"
                    value={form.title}
                    onChange={(e) => setForm((f) => f && ({ ...f, title: e.target.value }))}
                    placeholder="Clause title"
                    className="mt-1"
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="clause-body" className="text-xs text-gray-600">Body</Label>
                <Textarea
                  id="clause-body"
                  value={form.body}
                  onChange={(e) => setForm((f) => f && ({ ...f, body: e.target.value }))}
                  placeholder="Clause body text. Use {{variable}} for tokens."
                  className="mt-1 min-h-[160px] font-mono text-sm"
                />
              </div>
              <div>
                <Label htmlFor="clause-tags" className="text-xs text-gray-600">Tags <span className="text-gray-400 font-normal">(comma-separated)</span></Label>
                <Input
                  id="clause-tags"
                  value={form.tags}
                  onChange={(e) => setForm((f) => f && ({ ...f, tags: e.target.value }))}
                  placeholder="e.g. structural, concrete"
                  className="mt-1"
                />
              </div>
            </div>
            <div className="px-6 py-4 border-t flex justify-end gap-3">
              <Button variant="ghost" onClick={() => setForm(null)}>Cancel</Button>
              <Button
                onClick={() => { void handleSaveClause(); }}
                disabled={saving || !form.sectionId || !form.code || !form.title}
              >
                {saving ? 'Saving…' : form.clauseId ? 'Save changes' : 'Create clause'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Import modal */}
      {showImport && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-label="Import clauses">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">Import JSON</h2>
              <button type="button" onClick={() => setShowImport(false)} className="text-gray-400 hover:text-gray-600 text-xl leading-none" aria-label="Close">×</button>
            </div>
            <div className="p-6 space-y-4">
              <p className="text-sm text-gray-600">
                Paste a JSON array of sections. Existing sections with matching codes will be reused.
              </p>
              <pre className="text-xs bg-gray-50 rounded-lg p-3 border border-gray-200 overflow-x-auto text-gray-600">{`[
  {
    "code": "03",
    "title": "Concrete",
    "clauses": [
      {
        "code": "03.01.01",
        "title": "General",
        "body": "Clause body text with {{variables}}.",
        "tags": ["structural"],
        "source": "practice"
      }
    ]
  }
]`}</pre>
              <Textarea
                value={importJson}
                onChange={(e) => setImportJson(e.target.value)}
                placeholder="Paste JSON here…"
                className="min-h-[200px] font-mono text-xs"
                aria-label="Import JSON content"
              />
            </div>
            <div className="px-6 py-4 border-t flex justify-end gap-3">
              <Button variant="ghost" onClick={() => setShowImport(false)}>Cancel</Button>
              <Button
                onClick={() => { void handleImport(); }}
                disabled={importing || !importJson.trim()}
              >
                {importing ? 'Importing…' : 'Import'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
