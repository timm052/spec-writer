'use client';

import { useEffect } from 'react';
import Link from 'next/link';

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function EditorError({ error, reset }: ErrorProps) {
  useEffect(() => {
    console.error('Editor error:', error);
  }, [error]);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-8">
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-10 max-w-md w-full text-center">
        <div className="text-4xl mb-4">📄</div>
        <h1 className="text-xl font-semibold text-gray-900 mb-2">Failed to load editor</h1>
        <p className="text-sm text-gray-500 mb-6">
          The specification editor could not be loaded. Your work is safe — please try again.
        </p>
        <div className="flex items-center justify-center gap-3">
          <button
            type="button"
            onClick={reset}
            className="inline-flex items-center px-4 py-2 rounded-lg text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 transition-colors"
          >
            Try again
          </button>
          <Link
            href="/project"
            className="inline-flex items-center px-4 py-2 rounded-lg text-sm font-medium text-gray-700 bg-white border border-gray-200 hover:bg-gray-50 transition-colors"
          >
            Back to projects
          </Link>
        </div>
      </div>
    </div>
  );
}
