'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Dialog, Button, Input, Label } from '../shared';
import { toast } from '../../lib/toast';

interface ProjectActionsProps {
  project: {
    id: string;
    name: string;
    number?: string | null;
    client?: string | null;
    address?: string | null;
  };
}

export function ProjectActions({ project }: ProjectActionsProps) {
  const router = useRouter();
  const [showEdit, setShowEdit] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [duplicating, setDuplicating] = useState(false);

  // Edit form state
  const [name, setName] = useState(project.name);
  const [number, setNumber] = useState(project.number ?? '');
  const [client, setClient] = useState(project.client ?? '');
  const [address, setAddress] = useState(project.address ?? '');

  async function handleSaveEdit() {
    if (!name.trim()) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/projects/${project.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim(), number: number || null, client: client || null, address: address || null }),
      });
      if (res.ok) {
        toast('Project updated');
        setShowEdit(false);
        router.refresh();
      } else {
        toast('Failed to update project', 'error');
      }
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    setDeleting(true);
    try {
      const res = await fetch(`/api/projects/${project.id}`, { method: 'DELETE' });
      if (res.ok) {
        router.push('/project');
      } else {
        toast('Failed to delete project', 'error');
        setShowDelete(false);
      }
    } finally {
      setDeleting(false);
    }
  }

  async function handleDuplicate() {
    setDuplicating(true);
    try {
      const res = await fetch(`/api/projects/${project.id}/duplicate`, { method: 'POST' });
      if (res.ok) {
        const newProject = await res.json() as { id: string };
        toast('Project duplicated');
        router.push(`/project/${newProject.id}`);
      } else {
        toast('Failed to duplicate project', 'error');
      }
    } finally {
      setDuplicating(false);
    }
  }

  return (
    <>
      <div className="flex items-center gap-2">
        <Button variant="secondary" size="sm" onClick={() => setShowEdit(true)}>
          Edit
        </Button>
        <Button variant="secondary" size="sm" onClick={handleDuplicate} disabled={duplicating}>
          {duplicating ? 'Duplicating…' : 'Duplicate'}
        </Button>
        <Button
          variant="secondary"
          size="sm"
          onClick={() => setShowDelete(true)}
          className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
        >
          Delete
        </Button>
      </div>

      {/* Edit modal */}
      <Dialog open={showEdit} onClose={() => setShowEdit(false)} title="Edit Project">
        <div className="space-y-4">
          <div>
            <Label htmlFor="edit-name">Project name *</Label>
            <Input id="edit-name" value={name} onChange={(e) => setName(e.target.value)} className="mt-1" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="edit-number">Project number</Label>
              <Input id="edit-number" value={number} onChange={(e) => setNumber(e.target.value)} placeholder="e.g. 2024-001" className="mt-1" />
            </div>
            <div>
              <Label htmlFor="edit-client">Client</Label>
              <Input id="edit-client" value={client} onChange={(e) => setClient(e.target.value)} placeholder="Client name" className="mt-1" />
            </div>
          </div>
          <div>
            <Label htmlFor="edit-address">Site address</Label>
            <Input id="edit-address" value={address} onChange={(e) => setAddress(e.target.value)} placeholder="123 Main St" className="mt-1" />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" onClick={() => setShowEdit(false)}>Cancel</Button>
            <Button onClick={handleSaveEdit} disabled={saving || !name.trim()}>
              {saving ? 'Saving…' : 'Save Changes'}
            </Button>
          </div>
        </div>
      </Dialog>

      {/* Delete confirmation */}
      <Dialog open={showDelete} onClose={() => setShowDelete(false)} title="Delete Project">
        <p className="text-sm text-gray-600 mb-6">
          Are you sure you want to delete <strong>{project.name}</strong>? This will permanently remove the project and all its clause customisations.
        </p>
        <div className="flex justify-end gap-2">
          <Button variant="secondary" onClick={() => setShowDelete(false)}>Cancel</Button>
          <Button
            onClick={handleDelete}
            disabled={deleting}
            className="bg-red-600 hover:bg-red-700 text-white"
          >
            {deleting ? 'Deleting…' : 'Delete Project'}
          </Button>
        </div>
      </Dialog>
    </>
  );
}
