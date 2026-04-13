'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import type { ClauseSet } from '@spec-writer/db';
import { toast } from '../../lib/toast';

interface ClauseSetSelectorProps {
  clauseSets: ClauseSet[];
  activeSetId: string;
  projectId?: string;
  basePath?: string;
}

export function ClauseSetSelector({ clauseSets, activeSetId, projectId, basePath = '/library' }: ClauseSetSelectorProps) {
  const router = useRouter();
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [creating, setCreating] = useState(false);

  function buildUrl(setId: string) {
    const params = new URLSearchParams();
    params.set('setId', setId);
    if (projectId) params.set('projectId', projectId);
    return `${basePath}?${params}`;
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!newName.trim()) return;
    setCreating(true);
    try {
      const res = await fetch('/api/clause-sets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newName.trim(), description: newDesc.trim() || undefined }),
      });
      if (!res.ok) {
        toast('Failed to create clause set', 'error');
        return;
      }
      const created = await res.json() as ClauseSet;
      setShowCreate(false);
      setNewName('');
      setNewDesc('');
      toast(`Created "${created.name}"`, 'success');
      router.push(buildUrl(created.id));
      router.refresh();
    } finally {
      setCreating(false);
    }
  }

  const activeSet = clauseSets.find((s) => s.id === activeSetId);

  return (
    <div className="flex items-center gap-3 flex-wrap">
      {/* Set tabs */}
      <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
        {clauseSets.map((set) => (
          <button
            key={set.id}
            type="button"
            onClick={() => router.push(buildUrl(set.id))}
            className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
              set.id === activeSetId
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {set.name}
          </button>
        ))}
        <button
          type="button"
          onClick={() => setShowCreate(true)}
          className="px-3 py-1.5 rounded-md text-sm font-medium text-blue-600 hover:text-blue-700 hover:bg-blue-50 transition-colors"
          aria-label="Create new clause set"
        >
          + New set
        </button>
      </div>

      {activeSet?.description && (
        <p className="text-xs text-gray-400 italic">{activeSet.description}</p>
      )}

      {/* Create set modal */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-md mx-4">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">New Clause Set</h2>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label htmlFor="set-name" className="block text-sm font-medium text-gray-700 mb-1">
                  Name <span className="text-red-500">*</span>
                </label>
                <input
                  id="set-name"
                  type="text"
                  required
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="e.g. NatSpec 2024, Residential, Commercial"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label htmlFor="set-desc" className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <input
                  id="set-desc"
                  type="text"
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  placeholder="Optional description"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="flex justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => { setShowCreate(false); setNewName(''); setNewDesc(''); }}
                  className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating || !newName.trim()}
                  className="px-4 py-2 text-sm font-medium bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                >
                  {creating ? 'Creating…' : 'Create set'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
