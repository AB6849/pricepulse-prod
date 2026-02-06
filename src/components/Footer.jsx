import { useEffect } from 'react';

export default function Footer() {
  useEffect(() => {
    const timer = setTimeout(() => {
      if (window.feather && typeof window.feather.replace === 'function') {
        const footer = document.querySelector('footer');
        if (footer) {
          const icons = footer.querySelectorAll('[data-feather]');
          icons.forEach(icon => {
            if (icon.parentNode && !icon.hasAttribute('data-feather-replaced')) {
              try {
                window.feather.replaceElement(icon);
                icon.setAttribute('data-feather-replaced', 'true');
              } catch (e) {
                console.warn('Feather icon replacement failed:', e);
              }
            }
          });
        }
      }
    }, 50);
    return () => clearTimeout(timer);
  }, []);

  return (
    <footer className="py-4 px-8 relative z-10 border-t border-white/5 bg-white/[0.02]">
      <div className="flex items-center justify-between gap-6 opacity-70 hover:opacity-100 transition-opacity duration-300">
        <img
          src="/trabenfull.png"
          alt="Traben logo"
          className="traben-logo h-7 object-contain hover:scale-105 transition-transform duration-500 cursor-pointer"
        />
        <p className="text-zinc-400 text-[11px] font-bold uppercase tracking-widest whitespace-nowrap">© 2026 Traben - Track Prices. Win Margins.</p>
      </div>
    </footer>
  );
}



