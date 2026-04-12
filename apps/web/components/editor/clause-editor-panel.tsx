'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { resolveClause } from '@spec-writer/core';
import { Badge, Button, Textarea } from '../shared';
import dynamic from 'next/dynamic';

const ClauseRichEditor = dynamic(
  () => import('./clause-rich-editor').then((m) => m.ClauseRichEditor),
  { ssr: false, loading: () => <div className="h-[140px] bg-gray-50 rounded-md border border-gray-200 animate-pulse" /> },
);
import { practiceVarsPromise } from '../../lib/practice-vars-client';

type ClauseStatus = 'draft' | 'reviewed' | 'approved';

const STATUS_CONFIG: Record<ClauseStatus, { label: string; variant: 'secondary' | 'warning' | 'success'; next: ClauseStatus }> = {
  draft:    { label: 'Draft',    variant: 'secondary', next: 'reviewed' },
  reviewed: { label: 'Reviewed', variant: 'warning',   next: 'approved' },
  approved: { label: 'Approved', variant: 'success',   next: 'draft' },
};

interface ClauseData {
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

interface ClauseEditorPanelProps {
  projectId: string;
  clause: ClauseData;
  projectVariables: Record<string, string>;
  dragHandle?: React.ReactNode;
  onRemoved?: (projectClauseId: string) => void;
  onStatusChange?: (projectClauseId: string, status: ClauseStatus) => void;
}

export function ClauseEditorPanel({
  projectId,
  clause,
  projectVariables,
  dragHandle,
  onRemoved,
  onStatusChange,
}: ClauseEditorPanelProps) {
  const [currentBody, setCurrentBody] = useState(clause.body);
  const [preview, setPreview] = useState(clause.resolvedBody);
  const [saving, setSaving] = useState(false);
  const [justSaved, setJustSaved] = useState(false);
  const [isOverridden, setIsOverridden] = useState(clause.bodyOverride !== null);
  const [status, setStatus] = useState<ClauseStatus>(clause.status);
  const [notes, setNotes] = useState(clause.notes ?? '');
  const [showNotes, setShowNotes] = useState(clause.notes !== null && clause.notes !== '');
  const [practiceVars, setPracticeVars] = useState<Record<string, string>>({});

  const previewDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const autoSaveRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const savedTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const notesDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const currentBodyRef = useRef(currentBody);
  currentBodyRef.current = currentBody;

  useEffect(() => {
    void practiceVarsPromise.then(setPracticeVars);
  }, []);

  useEffect(() => {
    return () => {
      if (previewDebounceRef.current) clearTimeout(previewDebounceRef.current);
      if (autoSaveRef.current) clearTimeout(autoSaveRef.current);
      if (savedTimerRef.current) clearTimeout(savedTimerRef.current);
      if (notesDebounceRef.current) clearTimeout(notesDebounceRef.current);
    };
  }, []);

  const updatePreview = useCallback(
    (html: string) => {
      if (previewDebounceRef.current) clearTimeout(previewDebounceRef.current);
      previewDebounceRef.current = setTimeout(() => {
        setPreview(resolveClause(html, projectVariables, practiceVars));
      }, 300);
    },
    [projectVariables, practiceVars],
  );

  const patchClause = useCallback(
    async (data: Record<string, unknown>) => {
      await fetch(`/api/projects/${projectId}/clauses/${clause.projectClauseId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
    },
    [projectId, clause.projectClauseId],
  );

  const saveBody = useCallback(
    async (body: string) => {
      setSaving(true);
      try {
        await patchClause({ bodyOverride: body });
        setIsOverridden(true);
        setJustSaved(true);
        if (savedTimerRef.current) clearTimeout(savedTimerRef.current);
        savedTimerRef.current = setTimeout(() => setJustSaved(false), 3000);
      } finally {
        setSaving(false);
      }
    },
    [patchClause],
  );

  function handleChange(html: string) {
    setCurrentBody(html);
    updatePreview(html);
    if (autoSaveRef.current) clearTimeout(autoSaveRef.current);
    autoSaveRef.current = setTimeout(() => {
      void saveBody(currentBodyRef.current);
    }, 1500);
  }

  async function handleManualSave() {
    if (autoSaveRef.current) clearTimeout(autoSaveRef.current);
    await saveBody(currentBody);
  }

  async function handleResetToBase() {
    if (autoSaveRef.current) clearTimeout(autoSaveRef.current);
    await patchClause({ bodyOverride: null });
    setCurrentBody(clause.baseBody);
    updatePreview(clause.baseBody);
    setIsOverridden(false);
    setJustSaved(false);
  }

  async function handleRemove() {
    if (autoSaveRef.current) clearTimeout(autoSaveRef.current);
    await patchClause({ included: false });
    onRemoved?.(clause.projectClauseId);
  }

  async function handleStatusCycle() {
    const next = STATUS_CONFIG[status].next;
    setStatus(next);
    await patchClause({ status: next });
    onStatusChange?.(clause.projectClauseId, next);
  }

  function handleNotesChange(value: string) {
    setNotes(value);
    if (notesDebounceRef.current) clearTimeout(notesDebounceRef.current);
    notesDebounceRef.current = setTimeout(() => {
      void patchClause({ notes: value || null });
    }, 1000);
  }

  const isDirty = currentBody !== clause.body;
  const statusCfg = STATUS_CONFIG[status];

  return (
    <div className="bg-white p-6 rounded-lg shadow">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-2">
          {dragHandle}
          <div>
            <h3 className="text-base font-medium text-gray-900">{clause.title}</h3>
            <p className="text-xs font-mono text-gray-400 mt-0.5">{clause.code}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          {/* Status badge — click to cycle */}
          <button
            type="button"
            onClick={handleStatusCycle}
            title={`Status: ${statusCfg.label} — click to advance`}
            aria-label={`Clause status: ${statusCfg.label}. Click to advance.`}
          >
            <Badge variant={statusCfg.variant}>{statusCfg.label}</Badge>
          </button>

          {isOverridden && <Badge variant="warning">Overridden</Badge>}
          {isOverridden && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleResetToBase}
              aria-label={`Reset clause ${clause.code} to base text`}
              className="text-yellow-700 hover:text-yellow-800 hover:bg-yellow-50 text-xs"
            >
              Reset to base
            </Button>
          )}
          <button
            type="button"
            onClick={() => setShowNotes((v) => !v)}
            aria-label={showNotes ? 'Hide notes' : 'Show notes'}
            className="text-xs text-gray-400 hover:text-gray-600 px-1"
            title="Internal notes (not exported)"
          >
            {showNotes ? '📝−' : '📝'}
          </button>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleRemove}
            aria-label={`Remove clause ${clause.code} from specification`}
            className="text-red-500 hover:text-red-700 hover:bg-red-50"
          >
            Remove
          </Button>
        </div>
      </div>

      {/* Notes (internal — not exported) */}
      {showNotes && (
        <div className="mb-4">
          <p className="text-xs font-medium text-gray-500 mb-1">Internal notes <span className="text-gray-400 font-normal">(not included in export)</span></p>
          <Textarea
            value={notes}
            onChange={(e) => handleNotesChange(e.target.value)}
            placeholder="Add notes for your team…"
            className="text-sm min-h-[64px] text-gray-700"
            aria-label={`Internal notes for clause ${clause.code}`}
          />
        </div>
      )}

      {/* Editor + Preview */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div>
          <p className="text-xs font-medium text-gray-600 mb-1">
            Clause Body
            {isOverridden && <span className="ml-1 text-yellow-600">(project override)</span>}
          </p>
          <ClauseRichEditor
            key={clause.projectClauseId}
            initialContent={currentBody}
            variables={projectVariables}
            onChange={handleChange}
            onSave={handleManualSave}
          />
          <div className="flex items-center gap-2 mt-2 min-h-[28px]">
            {saving ? (
              <span className="text-xs text-gray-400 flex items-center gap-1.5">
                <span className="inline-block w-3 h-3 border-2 border-gray-300 border-t-transparent rounded-full animate-spin" aria-hidden="true" />
                Saving…
              </span>
            ) : justSaved ? (
              <span className="text-xs text-green-600" role="status">Saved ✓</span>
            ) : isDirty ? (
              <Button size="sm" onClick={handleManualSave} aria-label={`Save clause ${clause.code}`}>
                Save
              </Button>
            ) : null}
          </div>
        </div>

        <div>
          <p className="text-xs font-medium text-gray-600 mb-1">
            Preview <span className="text-gray-400 font-normal">(variables resolved)</span>
          </p>
          <div
            className="prose prose-sm max-w-none p-3 bg-gray-50 rounded-md border border-gray-200 min-h-[120px] text-gray-700"
            aria-label="Resolved clause preview"
            dangerouslySetInnerHTML={{ __html: preview }}
          />
        </div>
      </div>
    </div>
  );
}
