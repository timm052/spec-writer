'use client';

import { useState } from 'react';
import { Dialog } from '../shared/dialog.js';

interface ExportModalProps {
  projectId: string;
  projectName: string;
  open: boolean;
  onClose: () => void;
}

type ExportFormat = 'html' | 'pdf' | 'docx' | 'json';

interface FormatOption {
  id: ExportFormat;
  label: string;
  description: string;
  icon: string;
  ext: string;
}

const FORMAT_OPTIONS: FormatOption[] = [
  {
    id: 'pdf',
    label: 'PDF',
    description: 'Print-ready A4 document with section headings and page numbers',
    icon: 'PDF',
    ext: '.pdf',
  },
  {
    id: 'docx',
    label: 'Word Document',
    description: 'Editable .docx file with styled headings and footers',
    icon: 'DOC',
    ext: '.docx',
  },
  {
    id: 'json',
    label: 'JSON',
    description: 'Machine-readable structured data with all resolved clause text',
    icon: '{ }',
    ext: '.json',
  },
  {
    id: 'html',
    label: 'HTML Preview',
    description: 'Browser preview with print-to-PDF option',
    icon: 'HTM',
    ext: '',
  },
];

export function ExportModal({ projectId, projectName, open, onClose }: ExportModalProps) {
  const [exporting, setExporting] = useState<ExportFormat | null>(null);

  async function handleExport(format: ExportFormat) {
    if (exporting) return;

    if (format === 'html') {
      window.open(`/api/projects/${projectId}/export`, '_blank');
      return;
    }

    setExporting(format);
    try {
      const res = await fetch(`/api/projects/${projectId}/export/${format}`);
      if (!res.ok) {
        const err = (await res.json()) as { error?: string };
        alert(err.error ?? 'Export failed');
        return;
      }

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const disposition = res.headers.get('Content-Disposition') ?? '';
      const match = /filename="([^"]+)"/.exec(disposition);
      a.download = match?.[1] ?? `${projectName} — Specification.${format}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      onClose();
    } finally {
      setExporting(null);
    }
  }

  return (
    <Dialog open={open} onClose={onClose} title="Export Specification">
      <p className="text-sm text-gray-500 -mt-2 mb-4">{projectName}</p>
      <div className="space-y-2">
        {FORMAT_OPTIONS.map((fmt) => {
          const isLoading = exporting === fmt.id;
          return (
            <button
              key={fmt.id}
              type="button"
              disabled={exporting !== null}
              onClick={() => handleExport(fmt.id)}
              aria-label={`Export as ${fmt.label}`}
              className="w-full flex items-start gap-4 px-4 py-3 rounded-lg border border-gray-200 hover:border-blue-400 hover:bg-blue-50 transition-colors text-left disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span
                aria-hidden="true"
                className="w-10 h-7 flex items-center justify-center rounded text-xs font-bold bg-gray-100 text-gray-500 flex-shrink-0 mt-0.5"
              >
                {isLoading ? (
                  <span className="inline-block w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                ) : (
                  fmt.icon
                )}
              </span>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-gray-900">
                  {fmt.label}
                  {fmt.ext && (
                    <span className="ml-1.5 text-xs font-normal text-gray-400">{fmt.ext}</span>
                  )}
                </p>
                <p className="text-xs text-gray-500 mt-0.5">{fmt.description}</p>
              </div>
            </button>
          );
        })}
      </div>
    </Dialog>
  );
}
