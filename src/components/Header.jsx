import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useEffect, useState, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';

export default function Header() {
  const location = useLocation();
  const navigate = useNavigate();
  const auth = useAuth();
  const { profile, brands, currentBrand, switchBrand, signOut, isAdmin } = auth || {};
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    // Use a ref-based approach to safely replace feather icons
    const timer = setTimeout(() => {
      if (window.feather && typeof window.feather.replace === 'function') {
        // Only replace icons in the header, which are stable
        const header = document.querySelector('header');
        if (header) {
          const icons = header.querySelectorAll('[data-feather]');
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
  }, [location]);

  const isActive = (path) => {
    return location.pathname === path;
  };

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, []);

  return (
    <header className="sticky top-0 z-50 px-4 py-4">
      <div className="container mx-auto">
        <div className="glass-card px-6 py-3 flex justify-between items-center border-white/5 bg-white/[0.02]">
          <div className="flex items-center gap-4">
            {/* Sidebar Toggle for Mobile would go here */}
            <h2 className="text-lg font-bold text-white lg:hidden">TRABEN</h2>
          </div>

          <div className="flex items-center gap-8">
            <nav className="hidden md:block">
              <ul className="flex items-center gap-6">
                {[
                  { path: '/', label: 'Home' },
                  { path: '/blinkit', label: 'Blinkit' },
                  { path: '/swiggy', label: 'Instamart' },
                  { path: '/zepto', label: 'Zepto' },
                  { path: '/amazon', label: 'Amazon' },
                  { path: '/benchmarks', label: 'Set Metrics' }
                ].map((item) => (
                  <li key={item.path}>
                    <Link
                      to={item.path}
                      className={`text-sm font-medium transition-all duration-300 relative group py-2
                        ${isActive(item.path) ? 'text-white' : 'text-zinc-400 hover:text-white'}`}
                    >
                      {item.label}
                      <span className={`absolute bottom-0 left-0 w-full h-0.5 bg-indigo-500 transition-all duration-300 origin-left
                        ${isActive(item.path) ? 'scale-x-100 opacity-100' : 'scale-x-0 opacity-0 group-hover:scale-x-50 group-hover:opacity-50'}`}
                      />
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>

            <div className="flex items-center gap-4 border-l border-white/10 pl-8">
              {profile && (
                <div className="relative" ref={dropdownRef}>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsDropdownOpen(!isDropdownOpen);
                    }}
                    className="flex items-center gap-2 py-1.5 px-2 rounded-xl hover:bg-white/5 transition-all"
                  >
                    <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 p-[1px]">
                      <div className="w-full h-full rounded-full bg-zinc-950 flex items-center justify-center text-xs font-bold text-white">
                        {profile?.full_name?.charAt(0)?.toUpperCase() || profile?.email?.charAt(0)?.toUpperCase() || 'U'}
                      </div>
                    </div>
                    <span className="hidden md:block text-sm font-medium text-zinc-300">
                      {profile?.full_name?.split(' ')[0] || 'User'}
                    </span>
                    <svg
                      className={`w-4 h-4 text-zinc-500 transition-transform duration-300 ${isDropdownOpen ? 'rotate-180' : ''}`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>

                  {isDropdownOpen && (
                    <div className="absolute right-0 mt-4 w-56 glass-card border-white/10 p-2 overflow-hidden animate-reveal shadow-2xl">
                      <div className="px-4 py-3 border-b border-white/5 mb-1">
                        <p className="text-sm font-semibold text-white truncate">{profile?.full_name || 'User'}</p>
                        <p className="text-[10px] text-zinc-500 truncate mt-0.5 uppercase tracking-wider">{profile?.role?.replace('_', ' ')}</p>
                      </div>
                      <div className="flex flex-col gap-1">
                        {isAdmin && (
                          <button
                            onMouseDown={(e) => {
                              e.preventDefault(); e.stopPropagation();
                              setIsDropdownOpen(false);
                              setTimeout(() => navigate('/admin/users'), 100);
                            }}
                            className="w-full text-left px-4 py-2 text-sm text-zinc-300 hover:bg-white/5 rounded-lg transition-colors flex items-center gap-2"
                          >
                            <i data-feather="users" className="w-4 h-4"></i>
                            Manage Users
                          </button>
                        )}
                        <button
                          onMouseDown={(e) => {
                            e.preventDefault(); e.stopPropagation();
                            setIsDropdownOpen(false);
                            setTimeout(async () => {
                              try { if (signOut) await signOut(); navigate('/login', { replace: true }); }
                              catch (err) { console.error(err); }
                            }, 100);
                          }}
                          className="w-full text-left px-4 py-2 text-sm text-red-400 hover:bg-red-500/10 rounded-lg transition-colors flex items-center gap-2"
                        >
                          <i data-feather="log-out" className="w-4 h-4"></i>
                          Sign Out
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}



