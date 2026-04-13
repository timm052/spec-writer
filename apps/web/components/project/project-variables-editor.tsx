'use client';

import { useState } from 'react';
import { Button, Input, Label } from '../shared';
import { toast } from '../../lib/toast';

interface ProjectVariablesEditorProps {
  projectId: string;
  variables: Record<string, string>;
  onSaved?: (variables: Record<string, string>) => void;
}

export function ProjectVariablesEditor({ projectId, variables, onSaved }: ProjectVariablesEditorProps) {
  const [values, setValues] = useState<Record<string, string>>(variables);
  const [saving, setSaving] = useState(false);
  const [newKey, setNewKey] = useState('');
  const [newValue, setNewValue] = useState('');

  async function handleSave() {
    setSaving(true);
    try {
      const res = await fetch(`/api/projects/${projectId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ variables: values }),
      });
      if (res.ok) {
        toast('Variables saved');
        onSaved?.(values);
      } else {
        toast('Failed to save variables', 'error');
      }
    } finally {
      setSaving(false);
    }
  }

  // Token keys must be safe identifier characters for use inside {{token}} templates
  const TOKEN_KEY_RE = /^[a-zA-Z][a-zA-Z0-9._-]*$/;

  function addVariable() {
    const trimmedKey = newKey.trim();
    if (!trimmedKey) return;
    if (!TOKEN_KEY_RE.test(trimmedKey)) {
      toast('Token key must start with a letter and contain only letters, numbers, dots, hyphens, or underscores', 'error');
      return;
    }
    setValues((prev) => ({ ...prev, [trimmedKey]: newValue }));
    setNewKey('');
    setNewValue('');
  }

  const hasVariables = Object.keys(values).length > 0;

  return (
    <div className="space-y-5">
      {hasVariables && (
        <div className="rounded-lg border border-gray-100 overflow-hidden">
          {/* Column headers */}
          <div className="grid grid-cols-[220px_1fr_32px] bg-gray-50 px-4 py-2 border-b border-gray-100">
            <span className="text-xs font-medium text-gray-400 uppercase tracking-wide">Token</span>
            <span className="text-xs font-medium text-gray-400 uppercase tracking-wide">Value</span>
            <span />
          </div>
          {/* Rows */}
          <div className="divide-y divide-gray-50">
            {Object.entries(values).map(([key, value]) => (
              <div key={key} className="grid grid-cols-[220px_1fr_32px] items-center px-4 py-2.5 gap-4">
                <span className="text-xs font-mono text-gray-500 truncate">{`{{${key}}}`}</span>
                <Input
                  value={value}
                  onChange={(e) => setValues((prev) => ({ ...prev, [key]: e.target.value }))}
                  aria-label={`Value for ${key}`}
                />
                <button
                  type="button"
                  onClick={() => setValues((prev) => {
                    const next = { ...prev };
                    delete next[key];
                    return next;
                  })}
                  aria-label={`Remove variable ${key}`}
                  className="text-gray-300 hover:text-red-500 transition-colors text-lg leading-none"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Add new variable */}
      <div className="flex items-end gap-3 pt-1">
        <div className="w-[220px] shrink-0">
          <Label htmlFor="new-key" className="text-xs text-gray-500">New token key</Label>
          <Input
            id="new-key"
            value={newKey}
            onChange={(e) => setNewKey(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && addVariable()}
            placeholder="e.g. project.name"
            className="mt-1"
          />
        </div>
        <div className="flex-1">
          <Label htmlFor="new-value" className="text-xs text-gray-500">Value</Label>
          <Input
            id="new-value"
            value={newValue}
            onChange={(e) => setNewValue(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && addVariable()}
            placeholder="e.g. Sky Tower"
            className="mt-1"
          />
        </div>
        <Button type="button" variant="secondary" size="sm" onClick={addVariable} aria-label="Add variable">
          Add
        </Button>
      </div>

      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={saving} aria-label="Save variables">
          {saving ? 'Saving…' : 'Save Variables'}
        </Button>
      </div>
    </div>
  );
}
