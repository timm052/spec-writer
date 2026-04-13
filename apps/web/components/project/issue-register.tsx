'use client';

import { useState } from 'react';
import { Button, Input, Label } from '../shared';
import { toast } from '../../lib/toast';

interface ProjectIssue {
  id: string;
  revision: string;
  description: string;
  issuedAt: string;
}

interface IssueRegisterProps {
  projectId: string;
  initialIssues: ProjectIssue[];
}

export function IssueRegister({ projectId, initialIssues }: IssueRegisterProps) {
  const [issues, setIssues] = useState<ProjectIssue[]>(initialIssues);
  const [revision, setRevision] = useState('');
  const [description, setDescription] = useState('');
  const [saving, setSaving] = useState(false);

  function nextRevision() {
    if (issues.length === 0) return 'Rev A';
    const last = issues[issues.length - 1]?.revision ?? '';
    const match = /Rev ([A-Z])$/.exec(last);
    if (match?.[1]) {
      const next = String.fromCharCode(match[1].charCodeAt(0) + 1);
      return `Rev ${next}`;
    }
    return '';
  }

  async function handleAdd() {
    if (!revision.trim() || !description.trim()) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/projects/${projectId}/issues`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ revision: revision.trim(), description: description.trim() }),
      });
      if (!res.ok) { toast('Failed to add issue', 'error'); return; }
      const created = await res.json() as ProjectIssue;
      setIssues((prev) => [...prev, created]);
      setRevision('');
      setDescription('');
      toast('Issue added');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string, revision: string) {
    if (!confirm(`Delete issue "${revision}"? This cannot be undone.`)) return;
    try {
      const res = await fetch(`/api/projects/${projectId}/issues/${id}`, { method: 'DELETE' });
      if (!res.ok) { toast('Failed to delete issue', 'error'); return; }
      setIssues((prev) => prev.filter((i) => i.id !== id));
    } catch {
      toast('Failed to delete issue', 'error');
    }
  }

  return (
    <div className="space-y-4">
      {issues.length > 0 ? (
        <div className="rounded-lg border border-gray-100 overflow-hidden">
          <div className="grid grid-cols-[100px_1fr_140px_32px] bg-gray-50 px-4 py-2 border-b border-gray-100 text-xs font-medium text-gray-400 uppercase tracking-wide">
            <span>Revision</span>
            <span>Description</span>
            <span>Date</span>
            <span />
          </div>
          <div className="divide-y divide-gray-50">
            {issues.map((issue) => (
              <div key={issue.id} className="grid grid-cols-[100px_1fr_140px_32px] items-center px-4 py-2.5 gap-4">
                <span className="text-xs font-mono font-medium text-gray-700">{issue.revision}</span>
                <span className="text-sm text-gray-700">{issue.description}</span>
                <span className="text-xs text-gray-400">
                  {new Date(issue.issuedAt).toLocaleDateString('en-AU', {
                    day: 'numeric', month: 'short', year: 'numeric',
                  })}
                </span>
                <button
                  type="button"
                  onClick={() => { void handleDelete(issue.id, issue.revision); }}
                  aria-label={`Delete issue ${issue.revision}`}
                  className="text-gray-300 hover:text-red-500 transition-colors text-lg leading-none"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <p className="text-sm text-gray-400">No issues recorded yet.</p>
      )}

      {/* Add new issue */}
      <div className="flex items-end gap-3 pt-1">
        <div className="w-[100px] shrink-0">
          <Label htmlFor="issue-revision" className="text-xs text-gray-500">Revision</Label>
          <Input
            id="issue-revision"
            value={revision}
            onChange={(e) => setRevision(e.target.value)}
            onFocus={() => { if (!revision) setRevision(nextRevision()); }}
            placeholder="Rev A"
            className="mt-1"
          />
        </div>
        <div className="flex-1">
          <Label htmlFor="issue-description" className="text-xs text-gray-500">Description</Label>
          <Input
            id="issue-description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') void handleAdd(); }}
            placeholder="e.g. Tender issue"
            className="mt-1"
          />
        </div>
        <Button
          type="button"
          variant="secondary"
          size="sm"
          onClick={() => { void handleAdd(); }}
          disabled={saving || !revision.trim() || !description.trim()}
          aria-label="Add issue to register"
        >
          Add
        </Button>
      </div>
    </div>
  );
}
