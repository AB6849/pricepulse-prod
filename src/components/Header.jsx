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
    <header className="gradient-bg text-white shadow md:shadow-2xl sticky top-0 z-50">
      <div className="container mx-auto px-4 py-3 md:py-6">
        <div className="flex justify-between items-center">
          <Link to="/" className="flex items-center gap-1">
            <img
              src="/pricepulselogo.png"
              alt="PricePulse Logo"
              className="logo-glow-white h-9 md:h-16 -mr-1"
            />
            <div className="leading-tight">
              <h1 className="text-lg md:text-3xl font-bold">PricePulse</h1>
              <p className="hidden md:block text-indigo-100 text-sm">
                Smart Price Tracking
              </p>
            </div>
          </Link>


          <div className="flex items-center gap-3 md:gap-6">
            <nav className="hidden md:block">
              <ul className="flex space-x-6">
                <li>
                  <Link
                    to="/"
                    className={`text-lg font-semibold hover:text-indigo-200 transition-all duration-300 hover:scale-110 ${isActive('/') ? 'bg-white text-indigo-600 px-3 py-1 rounded' : ''
                      }`}
                  >
                    Home
                  </Link>
                </li>
                <li>
                  <Link
                    to="/blinkit"
                    className={`text-lg font-semibold hover:text-indigo-200 transition-all duration-300 hover:scale-110 ${isActive('/blinkit') ? 'bg-white text-indigo-600 px-3 py-1 rounded' : ''
                      }`}
                  >
                    Blinkit
                  </Link>
                </li>
                <li>
                  <Link
                    to="/swiggy"
                    className={`text-lg font-semibold hover:text-indigo-200 transition-all duration-300 hover:scale-110 ${isActive('/swiggy') ? 'bg-white text-indigo-600 px-3 py-1 rounded' : ''
                      }`}
                  >
                    Swiggy
                  </Link>
                </li>
                <li>
                  <Link
                    to="/zepto"
                    className={`text-lg font-semibold hover:text-indigo-200 transition-all duration-300 hover:scale-110 ${isActive('/zepto') ? 'bg-white text-indigo-600 px-3 py-1 rounded' : ''
                      }`}
                  >
                    Zepto
                  </Link>
                </li>
                <li>
                  <Link
                    to="/amazon"
                    className={`text-lg font-semibold hover:text-indigo-200 transition-all duration-300 hover:scale-110 ${isActive('/amazon') ? 'bg-white text-indigo-600 px-3 py-1 rounded' : ''
                      }`}
                  >
                    Amazon
                  </Link>
                </li>
                <li>
                  <Link
                    to="/benchmarks"
                    className={`text-lg font-semibold hover:text-indigo-200 transition-all duration-300 hover:scale-110 ${isActive('/benchmarks') ? 'bg-white text-indigo-600 px-3 py-1 rounded' : ''
                      }`}
                  >
                    Set Metrics
                  </Link>
                </li>
              </ul>
            </nav>

            <div className="flex items-center gap-4">
              {/* User Menu */}
              {profile && (
                <div className="relative" ref={dropdownRef}>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsDropdownOpen(!isDropdownOpen);
                    }}
                    className="flex items-center gap-2 bg-white/10 rounded-lg px-2 py-2 md:px-3 transition-all"
                  >
                    <div className="w-8 h-8 bg-indigo-500 rounded-full flex items-center justify-center text-white font-semibold">
                      {profile?.full_name?.charAt(0)?.toUpperCase() || profile?.email?.charAt(0)?.toUpperCase() || 'U'}
                    </div>
                    <span className="hidden md:block text-sm">{profile?.full_name || profile?.email || 'User'}</span>
                    <svg
                      className={`w-4 h-4 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>

                  {/* Dropdown Menu - Click to open/close */}
                  {isDropdownOpen && (
                    <div
                      className="absolute right-0 mt-2 w-48 md:w-56 bg-gray-800 rounded-lg shadow-xl border border-gray-700 z-[9999] origin-top-right"
                    >
                      <div className="py-2">
                        <div className="px-4 py-3 border-b border-gray-700">
                          <p className="text-sm font-semibold text-white">{profile?.full_name || 'User'}</p>
                          <p className="text-xs text-gray-400 mt-1">{profile?.email}</p>
                          <p className="text-xs text-indigo-400 mt-1 capitalize">{profile?.role?.replace('_', ' ')}</p>
                        </div>
                        <div className="py-1">
                          {isAdmin && (
                            <button
                              onMouseDown={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                console.log('Manage Users clicked');
                                setIsDropdownOpen(false);
                                setTimeout(() => navigate('/admin/users'), 100);
                              }}
                              className="w-full text-left px-4 py-2 text-sm text-gray-300 hover:bg-gray-700 transition-colors"
                              type="button"
                            >
                              Manage Users
                            </button>
                          )}
                          <button
                            onMouseDown={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              console.log('Sign Out clicked');
                              setIsDropdownOpen(false);
                              setTimeout(() => {
                                if (signOut) {
                                  signOut().catch(console.error);
                                }
                              }, 100);
                            }}
                            className="w-full text-left px-4 py-2 text-sm text-red-400 hover:bg-gray-700 transition-colors"
                            type="button"
                          >
                            Sign Out
                          </button>
                        </div>
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



