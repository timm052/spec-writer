'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import Link from 'next/link';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
  arrayMove,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { SectionSidebar } from '../../../components/editor/section-sidebar';
import { LibraryBrowser } from '../../../components/library/library-browser';
import { ClauseEditorPanel } from '../../../components/editor/clause-editor-panel';
import { ExportButton } from '../../../components/project/export-button';
import { SpecPreviewModal } from '../../../components/editor/spec-preview-modal';
import { Input } from '../../../components/shared';
import type { Section } from '@spec-writer/db';

type ClauseStatus = 'draft' | 'reviewed' | 'approved';

interface SpecClause {
  projectClauseId: string;
  clauseId: string;
  code: string;
  title: string;
  body: string;
  baseBody: string;
  resolvedBody: string;
  included: boolean;
  bodyOverride: string | null;
  sortOrder: number;
  status: ClauseStatus;
  notes: string | null;
}

interface SpecSection {
  id: string;
  code: string;
  title: string;
  clauses: SpecClause[];
}

interface EditorClientProps {
  project: { id: string; name: string };
  specSections: SpecSection[];
  librarySections: Section[];
  projectVariables: Record<string, string>;
}

// ─── Sortable clause wrapper ──────────────────────────────────────────────────

function SortableClause({
  clause,
  projectId,
  projectVariables,
  onRemoved,
  onStatusChange,
}: {
  clause: SpecClause;
  projectId: string;
  projectVariables: Record<string, string>;
  onRemoved: (id: string) => void;
  onStatusChange: (id: string, status: ClauseStatus) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: clause.projectClauseId,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const dragHandle = (
    <button
      {...attributes}
      {...listeners}
      className="cursor-grab active:cursor-grabbing text-gray-300 hover:text-gray-500 px-1 mr-1 touch-none"
      aria-label="Drag to reorder clause"
      type="button"
    >
      ⠿
    </button>
  );

  return (
    // eslint-disable-next-line react/forbid-dom-props -- dnd-kit requires inline transform/transition
    <div ref={setNodeRef} style={style}>
      <ClauseEditorPanel
        projectId={projectId}
        clause={clause}
        projectVariables={projectVariables}
        dragHandle={dragHandle}
        onRemoved={onRemoved}
        onStatusChange={onStatusChange}
      />
    </div>
  );
}

// ─── Main client ─────────────────────────────────────────────────────────────

export function EditorClient({
  project,
  specSections: initialSections,
  librarySections,
  projectVariables,
}: EditorClientProps) {
  const [sections, setSections] = useState(initialSections);
  const [activeSectionId, setActiveSectionId] = useState<string | undefined>(
    initialSections[0]?.id,
  );
  const [searchQuery, setSearchQuery] = useState('');
  const [showPreview, setShowPreview] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const suppressScrollSpyRef = useRef(false);

  // Scroll-spy
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (suppressScrollSpyRef.current) return;
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible[0]) {
          const id = (visible[0].target as HTMLElement).dataset['sectionId'];
          if (id) setActiveSectionId(id);
        }
      },
      { root: container, threshold: 0.15 },
    );
    const els = container.querySelectorAll<HTMLElement>('[data-section-id]');
    els.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sections]);

  const refreshSections = useCallback(async () => {
    const res = await fetch(`/api/projects/${project.id}/spec`);
    if (!res.ok) return;
    const data = await res.json() as {
      sections: Array<{
        id: string; code: string; title: string;
        clauses: Array<{
          projectClauseId: string; clauseId: string; code: string; title: string;
          body: string; baseBody: string; resolvedBody: string;
          included: boolean; bodyOverride: string | null; sortOrder: number;
          status: ClauseStatus; notes: string | null;
        }>;
      }>;
    };
    setSections(data.sections.map((s) => ({ ...s, clauses: s.clauses.filter((c) => c.included) })));
  }, [project.id]);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const handleRemoved = useCallback((projectClauseId: string) => {
    setSections((prev) =>
      prev
        .map((s) => ({ ...s, clauses: s.clauses.filter((c) => c.projectClauseId !== projectClauseId) }))
        .filter((s) => s.clauses.length > 0),
    );
  }, []);

  const handleStatusChange = useCallback((projectClauseId: string, status: ClauseStatus) => {
    setSections((prev) =>
      prev.map((s) => ({
        ...s,
        clauses: s.clauses.map((c) =>
          c.projectClauseId === projectClauseId ? { ...c, status } : c,
        ),
      })),
    );
  }, []);

  async function handleResetAllOverrides() {
    if (!confirm('Reset all clause overrides in this project to their base library text?')) return;
    await fetch(`/api/projects/${project.id}/reset-overrides`, { method: 'POST' });
    await refreshSections();
  }

  async function handleDragEnd(event: DragEndEvent, sectionId: string) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    setSections((prev) =>
      prev.map((section) => {
        if (section.id !== sectionId) return section;
        const oldIndex = section.clauses.findIndex((c) => c.projectClauseId === active.id);
        const newIndex = section.clauses.findIndex((c) => c.projectClauseId === over.id);
        if (oldIndex === -1 || newIndex === -1) return section;
        const reordered = arrayMove(section.clauses, oldIndex, newIndex);
        reordered.forEach((clause, i) => {
          void fetch(`/api/projects/${project.id}/clauses/${clause.projectClauseId}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ sortOrder: i }),
          });
        });
        return { ...section, clauses: reordered.map((c, i) => ({ ...c, sortOrder: i })) };
      }),
    );
  }

  const visibleSections = sections.filter((s) => s.clauses.length > 0);

  // Apply search filter
  const q = searchQuery.trim().toLowerCase();
  const filteredSections = q
    ? visibleSections
        .map((s) => ({
          ...s,
          clauses: s.clauses.filter(
            (c) =>
              c.title.toLowerCase().includes(q) ||
              c.code.toLowerCase().includes(q) ||
              c.body.toLowerCase().includes(q),
          ),
        }))
        .filter((s) => s.clauses.length > 0)
    : visibleSections;

  // Sidebar sections enriched with completeness counts
  const sidebarSections = visibleSections.map((s) => ({
    id: s.id,
    code: s.code,
    title: s.title,
    clauseCount: s.clauses.length,
    reviewedCount: s.clauses.filter((c) => c.status === 'reviewed' || c.status === 'approved').length,
  }));

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <div className="w-64 bg-white shadow-lg flex-shrink-0">
        <div className="p-4 border-b">
          <Link href={`/project/${project.id}`} className="text-sm text-blue-600 hover:text-blue-800">
            ← Back to Project
          </Link>
          <h2 className="mt-2 text-base font-semibold text-gray-900 truncate">{project.name}</h2>
          <div className="mt-3 flex flex-col gap-2">
            <ExportButton projectId={project.id} projectName={project.name} />
            <button
              type="button"
              onClick={() => setShowPreview(true)}
              className="w-full text-left text-xs text-gray-500 hover:text-blue-600 px-1"
              aria-label="Open full-screen spec preview"
            >
              Preview spec ↗
            </button>
          </div>
        </div>
        <div className="p-4">
          <SectionSidebar
            sections={sidebarSections}
            activeSectionId={activeSectionId}
            onSelectSection={(id) => {
              suppressScrollSpyRef.current = true;
              setActiveSectionId(id);
              setTimeout(() => { suppressScrollSpyRef.current = false; }, 800);
            }}
          />
        </div>
      </div>

      {/* Main Content */}
      <div ref={scrollContainerRef} className="flex-1 overflow-auto">
        <div className="p-8 max-w-4xl">
          {/* Toolbar */}
          <div className="flex items-center justify-between gap-4 mb-6">
            <h1 className="text-2xl font-bold text-gray-900 shrink-0">Specification Editor</h1>
            <div className="flex items-center gap-3">
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search clauses…"
                className="w-48 text-sm"
                aria-label="Search clauses in this specification"
              />
              <button
                type="button"
                onClick={handleResetAllOverrides}
                className="text-xs text-gray-400 hover:text-red-600 whitespace-nowrap"
                aria-label="Reset all clause overrides to base library text"
              >
                Reset all overrides
              </button>
            </div>
          </div>

          {filteredSections.length === 0 && q ? (
            <div className="bg-white rounded-lg shadow p-8 text-center">
              <p className="text-gray-500">No clauses match &ldquo;{searchQuery}&rdquo;</p>
            </div>
          ) : visibleSections.length === 0 ? (
            <div className="bg-white rounded-lg shadow p-8 text-center">
              <p className="text-gray-500 mb-2">No clauses in this specification yet.</p>
              <p className="text-sm text-gray-400">Add clauses from the library below.</p>
            </div>
          ) : (
            filteredSections.map((section) => (
              <div key={section.id} id={`section-${section.id}`} data-section-id={section.id} className="mb-8">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">
                  {section.code} — {section.title}
                </h2>
                <DndContext
                  sensors={sensors}
                  collisionDetection={closestCenter}
                  onDragEnd={(e) => handleDragEnd(e, section.id)}
                >
                  <SortableContext
                    items={section.clauses.map((c) => c.projectClauseId)}
                    strategy={verticalListSortingStrategy}
                  >
                    <div className="space-y-4">
                      {section.clauses.map((clause) => (
                        <SortableClause
                          key={clause.projectClauseId}
                          clause={clause}
                          projectId={project.id}
                          projectVariables={projectVariables}
                          onRemoved={handleRemoved}
                          onStatusChange={handleStatusChange}
                        />
                      ))}
                    </div>
                  </SortableContext>
                </DndContext>
              </div>
            ))
          )}

          <div className="mt-12 bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Add Clauses from Library</h2>
            <LibraryBrowser
              sections={librarySections}
              projectId={project.id}
              onClauseAdded={() => { void refreshSections(); }}
            />
          </div>
        </div>
      </div>

      {/* Full-screen preview */}
      {showPreview && (
        <SpecPreviewModal projectId={project.id} onClose={() => setShowPreview(false)} />
      )}
    </div>
  );
}
