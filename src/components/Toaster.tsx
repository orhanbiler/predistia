"use client";
import React, { useEffect, useState } from 'react';

export type ToastItem = { id: number; message: string; type?: 'success' | 'error' | 'info' };

let listeners = new Set<(t: ToastItem) => void>();
let counter = 1;

export function toast(message: string, type: ToastItem['type'] = 'info') {
  const item: ToastItem = { id: counter++, message, type };
  listeners.forEach((cb) => cb(item));
}

export default function Toaster() {
  const [items, setItems] = useState<ToastItem[]>([]);
  useEffect(() => {
    const on = (t: ToastItem) => {
      setItems((prev) => [...prev, t]);
      setTimeout(() => setItems((prev) => prev.filter((x) => x.id !== t.id)), 3500);
    };
    listeners.add(on);
    return () => {
      listeners.delete(on);
    };
  }, []);

  return (
    <div style={{ position: 'fixed', right: 16, bottom: 16, display: 'flex', flexDirection: 'column', gap: 8, zIndex: 9999 }}>
      {items.map((t) => (
        <div
          key={t.id}
          style={{
            minWidth: 220,
            padding: '10px 14px',
            borderRadius: 8,
            color: '#fff',
            background: t.type === 'success' ? '#16a34a' : t.type === 'error' ? '#dc2626' : '#334155',
            boxShadow: '0 2px 10px rgba(0,0,0,0.15)'
          }}
        >
          {t.message}
        </div>
      ))}
    </div>
  );
}

