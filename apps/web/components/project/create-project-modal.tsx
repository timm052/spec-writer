'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { CreateProjectSchema, type CreateProjectFormValues } from '@spec-writer/core';
import { Dialog, Button, Input, Label } from '../shared';
import { toast } from '../../lib/toast';

interface CreateProjectModalProps {
  open: boolean;
  onClose: () => void;
  onCreated: (project: { id: string; name: string }) => void;
}

export function CreateProjectModal({ open, onClose, onCreated }: CreateProjectModalProps) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CreateProjectFormValues>({
    resolver: zodResolver(CreateProjectSchema),
  });

  async function onSubmit(data: CreateProjectFormValues) {
    const res = await fetch('/api/projects', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({})) as { error?: string };
      toast(body.error ?? 'Failed to create project', 'error');
      return;
    }
    const project = await res.json() as { id: string; name: string };
    reset();
    onCreated(project);
    onClose();
  }

  return (
    <Dialog open={open} onClose={onClose} title="New Project">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <Label htmlFor="name">Project Name *</Label>
          <Input id="name" {...register('name')} className="mt-1" aria-required="true" />
          {errors.name && <p className="mt-1 text-xs text-red-600">{errors.name.message}</p>}
        </div>
        <div>
          <Label htmlFor="number">Project Number</Label>
          <Input id="number" {...register('number')} className="mt-1" />
        </div>
        <div>
          <Label htmlFor="client">Client</Label>
          <Input id="client" {...register('client')} className="mt-1" />
        </div>
        <div>
          <Label htmlFor="address">Address</Label>
          <Input id="address" {...register('address')} className="mt-1" />
        </div>
        <div className="flex justify-end space-x-2 pt-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting} aria-label="Create project">
            {isSubmitting ? 'Creating...' : 'Create Project'}
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
