'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import type { ClauseSet } from '@spec-writer/db';
import { toast } from '../../lib/toast';

interface ProjectClauseSetSelectProps {
  projectId: string;
  clauseSets: ClauseSet[];
  activeSetId: string | null;
}

export function ProjectClauseSetSelect({ projectId, clauseSets, activeSetId }: ProjectClauseSetSelectProps) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);

  async function handleChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const value = e.target.value;
    setSaving(true);
    try {
      const res = await fetch(`/api/projects/${projectId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clauseSetId: value || null }),
      });
      if (!res.ok) {
        toast('Failed to update clause set', 'error');
        return;
      }
      router.refresh();
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex items-center gap-3">
      <label htmlFor="project-clause-set" className="text-sm text-gray-600 shrink-0">
        Clause set
      </label>
      <select
        id="project-clause-set"
        value={activeSetId ?? ''}
        onChange={(e) => { void handleChange(e); }}
        disabled={saving}
        className="border border-gray-200 rounded-md px-3 py-1.5 text-sm text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
      >
        <option value="">Default</option>
        {clauseSets.map((s) => (
          <option key={s.id} value={s.id}>{s.name}</option>
        ))}
      </select>
    </div>
  );
}
