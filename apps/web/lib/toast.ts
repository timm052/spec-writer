'use client';

export type ToastType = 'success' | 'error' | 'info';

export interface ToastItem {
  id: string;
  message: string;
  type: ToastType;
}

type ToastHandler = (toast: ToastItem) => void;

/** Simple typed event emitter — replaces Zustand store for toast notifications. */
const handlers = new Set<ToastHandler>();

export const toastEmitter = {
  on(handler: ToastHandler) {
    handlers.add(handler);
    return () => { handlers.delete(handler); };
  },
  emit(toast: ToastItem) {
    handlers.forEach((h) => h(toast));
  },
};

/** Call from anywhere — inside or outside React components. */
export function toast(message: string, type: ToastType = 'success') {
  const id = Math.random().toString(36).slice(2);
  toastEmitter.emit({ id, message, type });
}
