'use client';

import { useEffect, useState } from 'react';

interface SpecPreviewModalProps {
  projectId: string;
  onClose: () => void;
}

export function SpecPreviewModal({ projectId, onClose }: SpecPreviewModalProps) {
  const [html, setHtml] = useState<string | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    fetch(`/api/projects/${projectId}/export`)
      .then((r) => {
        if (!r.ok) throw new Error('Failed');
        return r.text();
      })
      .then(setHtml)
      .catch(() => setError(true));
  }, [projectId]);

  // Close on Escape
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 bg-black/60 flex flex-col"
      role="dialog"
      aria-modal="true"
      aria-label="Specification preview"
    >
      {/* Toolbar */}
      <div className="flex items-center justify-between bg-white border-b px-6 py-3 shrink-0">
        <span className="text-sm font-medium text-gray-700">Specification Preview</span>
        <div className="flex items-center gap-3">
          <a
            href={`/api/projects/${projectId}/export`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-blue-600 hover:underline"
          >
            Open in new tab ↗
          </a>
          <button
            type="button"
            onClick={onClose}
            className="text-sm text-gray-500 hover:text-gray-800 px-2 py-1 rounded hover:bg-gray-100"
            aria-label="Close preview"
          >
            ✕ Close
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto bg-gray-100 p-6">
        {error ? (
          <div className="text-center text-red-500 mt-20">Failed to load preview.</div>
        ) : html === null ? (
          <div className="text-center text-gray-400 mt-20">Loading…</div>
        ) : (
          <iframe
            srcDoc={html}
            title="Specification preview"
            className="w-full max-w-4xl mx-auto bg-white shadow-lg"
            style={{ minHeight: '80vh', border: 'none' }} // eslint-disable-line react/forbid-dom-props
          />
        )}
      </div>
    </div>
  );
}
