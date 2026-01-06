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
      className={`fixed bottom-8 left-1/2 transform -translate-x-1/2 bg-red-500/95 text-white px-7 py-4 rounded-2xl font-semibold shadow-lg z-50 transition-all duration-400 ${
        show ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
      }`}
      style={{ visibility: show ? 'visible' : 'hidden' }}
    >
      {message}
    </div>
  );
}



