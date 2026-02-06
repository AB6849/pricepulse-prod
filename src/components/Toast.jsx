import { useEffect, useState } from 'react';

export default function Toast({ message, show, onClose }) {
  useEffect(() => {
    if (show) {
      const timer = setTimeout(() => {
        onClose();
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [show, onClose]);

  if (!show) return null;

  return (
    <div
      className={`absolute bottom-12 left-1/2 transform -translate-x-1/2 px-8 py-4 rounded-2xl z-50 
        transition-all duration-500 ease-out border border-white/10 glass-card
        ${show ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-4 scale-95'}`}
      style={{
        visibility: show ? 'visible' : 'hidden',
        background: 'rgba(239, 68, 68, 0.15)',
        backdropFilter: 'blur(20px)',
        boxShadow: '0 0 40px rgba(239, 68, 68, 0.1)'
      }}
    >
      <div className="flex items-center gap-3">
        <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse shadow-[0_0_10px_rgba(239,68,68,0.5)]" />
        <span className="text-sm font-bold tracking-wide text-white uppercase">{message}</span>
      </div>
    </div>
  );
}



