'use client';

import { useState } from 'react';
import { toast } from '../../lib/toast';

type ProjectStatus = 'draft' | 'in-review' | 'issued';

const STATUS_LABELS: Record<ProjectStatus, string> = {
  draft: 'Draft',
  'in-review': 'In Review',
  issued: 'Issued',
};

const STATUS_CLASSES: Record<ProjectStatus, string> = {
  draft: 'bg-gray-100 text-gray-700',
  'in-review': 'bg-yellow-100 text-yellow-800',
  issued: 'bg-green-100 text-green-800',
};

interface ProjectStatusSelectProps {
  projectId: string;
  status: ProjectStatus;
}

export function ProjectStatusSelect({ projectId, status: initialStatus }: ProjectStatusSelectProps) {
  const [status, setStatus] = useState<ProjectStatus>(initialStatus);
  const [saving, setSaving] = useState(false);

  async function handleChange(next: ProjectStatus) {
    setSaving(true);
    try {
      const res = await fetch(`/api/projects/${projectId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: next }),
      });
      if (res.ok) {
        setStatus(next);
        toast(`Status updated to ${STATUS_LABELS[next]}`);
      } else {
        toast('Failed to update status', 'error');
      }
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex items-center gap-3">
      <span className="text-sm text-gray-600">Project status</span>
      <div className="flex items-center gap-2">
        {(Object.keys(STATUS_LABELS) as ProjectStatus[]).map((s) => (
          <button
            key={s}
            type="button"
            disabled={saving}
            onClick={() => { void handleChange(s); }}
            aria-pressed={status === s}
            aria-label={`Set status to ${STATUS_LABELS[s]}`}
            className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
              status === s
                ? STATUS_CLASSES[s]
                : 'bg-gray-50 text-gray-400 hover:bg-gray-100'
            }`}
          >
            {STATUS_LABELS[s]}
          </button>
        ))}
      </div>
    </div>
  );
}
