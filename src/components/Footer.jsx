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
    <footer className="bg-gray-900/50 backdrop-blur-sm text-white py-10 relative z-10 border-t border-white/10">
      <div className="container mx-auto px-4 text-center">
        <div className="flex justify-center items-center space-x-6 mb-4">
          <i data-feather="dollar-sign" className="w-8 h-8 text-indigo-400"></i>
          <h3 className="text-2xl font-bold">PricePulse</h3>
        </div>
        <p className="text-gray-400 mb-2">© 2025 PricePulse - The Ultimate Price Monitoring Tool</p>
        <p className="text-sm text-gray-500">Live data from Google Sheets • Updated every 4 hours</p>
      </div>
    </footer>
  );
}



