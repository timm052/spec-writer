'use client';

import { useState } from 'react';
import { ExportModal } from './export-modal';

interface ExportButtonProps {
  projectId: string;
  projectName: string;
}

export function ExportButton({ projectId, projectName }: ExportButtonProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Export specification"
        className="inline-flex items-center px-4 py-2 rounded-lg text-sm font-medium text-gray-700 bg-white border border-gray-200 hover:bg-gray-50 transition-colors shadow-sm"
      >
        Export
      </button>
      <ExportModal
        projectId={projectId}
        projectName={projectName}
        open={open}
        onClose={() => setOpen(false)}
      />
    </>
  );
}
