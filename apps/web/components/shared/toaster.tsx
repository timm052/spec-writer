'use client';

import { useEffect, useState } from 'react';
import { toastEmitter, type ToastItem } from '../../lib/toast';

const STYLES: Record<ToastItem['type'], string> = {
  success: 'bg-green-600',
  error: 'bg-red-600',
  info: 'bg-blue-600',
};

function Toast({ id, message, type, onRemove }: ToastItem & { onRemove: (id: string) => void }) {
  useEffect(() => {
    const t = setTimeout(() => onRemove(id), 3500);
    return () => clearTimeout(t);
  }, [id, onRemove]);

  return (
    <div className={`flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg text-white text-sm font-medium min-w-[260px] max-w-sm ${STYLES[type]}`}>
      <span className="flex-1">{message}</span>
      <button onClick={() => onRemove(id)} className="text-white/70 hover:text-white shrink-0" aria-label="Dismiss">✕</button>
    </div>
  );
}

export function Toaster() {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  useEffect(() => {
    return toastEmitter.on((toast) => {
      setToasts((prev) => [...prev, toast]);
    });
  }, []);

  function remove(id: string) {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-6 right-6 z-[200] flex flex-col gap-2 pointer-events-none">
      {toasts.map((t) => (
        <div key={t.id} className="pointer-events-auto">
          <Toast {...t} onRemove={remove} />
        </div>
      ))}
    </div>
  );
}
