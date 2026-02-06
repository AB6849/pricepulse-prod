import { useEffect, useState, useRef } from 'react';
import feather from 'feather-icons';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { getBrandLogo } from '../utils/brandUtils';

export default function Sidebar({ activeView, setActiveView }) {
    const navigate = useNavigate();
    const location = useLocation();
    const { profile, signOut, isAdmin, isSuperAdmin, brands, currentBrand, switchBrand } = useAuth() || {};
    const [isProfileOpen, setIsProfileOpen] = useState(false);
    const [isBrandSelectorOpen, setIsBrandSelectorOpen] = useState(false);
    const profileRef = useRef(null);
    const brandRef = useRef(null);

    useEffect(() => {
        // Initial replacement
        feather.replace();

        // Robust detector for any new icons (like in popovers)
        const observer = new MutationObserver((mutations) => {
            let shouldReplace = false;
            mutations.forEach(mutation => {
                if (mutation.addedNodes.length > 0) {
                    mutation.addedNodes.forEach(node => {
                        if (node.nodeType === 1) { // Element node
                            if (node.querySelector('[data-feather]') || node.hasAttribute('data-feather')) {
                                shouldReplace = true;
                            }
                        }
                    });
                }
            });
            if (shouldReplace) {
                feather.replace();
            }
        });

        observer.observe(document.body, {
            childList: true,
            subtree: true
        });

        return () => observer.disconnect();
    }, []);

    useEffect(() => {
        const handleClickOutside = (e) => {
            if (profileRef.current && !profileRef.current.contains(e.target)) {
                setIsProfileOpen(false);
            }
            if (brandRef.current && !brandRef.current.contains(e.target)) {
                setIsBrandSelectorOpen(false);
            }
        };
        document.addEventListener("click", handleClickOutside);
        return () => document.removeEventListener("click", handleClickOutside);
    }, []);

    const platforms = [
        { id: 'blinkit', label: 'Blinkit', logo: '/Blinkit-yellow-rounded.svg', path: '/blinkit' },
        { id: 'swiggy', label: 'Instamart', logo: '/instamart_logo.webp', path: '/swiggy' },
        { id: 'zepto', label: 'Zepto', logo: '/zeptologo.webp', path: '/zepto' },
        { id: 'amazon', label: 'Amazon', logo: '/amazonlogo.png', path: '/amazon' },
    ];

    const secondaryItems = [
        { id: 'benchmarks', label: 'Set Metrics', icon: 'sliders', path: '/benchmarks' },
    ];

    const analyticsItems = [
        { id: 'blinkit_analytics', label: 'Blinkit Analytics', logo: '/Blinkit-yellow-rounded.svg', path: '/blinkit/analytics' },
        { id: 'swiggy_analytics', label: 'Instamart Analytics', logo: '/instamart_logo.webp', path: '/swiggy/analytics' },
        { id: 'zepto_analytics', label: 'Zepto Analytics', logo: '/zeptologo.webp', path: '/zepto/analytics' },
    ];


    return (
        <aside className="fixed left-0 top-0 h-screen w-80 z-40 p-6 hidden lg:block">
            <div className="glass-card glass-panel h-full flex flex-col">
                {/* Branding Area */}
                <div className="p-8 mb-4 border-b border-white/5 flex justify-center">
                    <img
                        src="/trabenfull.png"
                        alt="Traben Logo"
                        className="traben-logo h-12 w-auto cursor-pointer"
                        onClick={() => navigate('/')}
                    />
                </div>
                {/* Brand Selector for Super Admins */}
                {isSuperAdmin && brands && brands.length > 1 && (
                    <div className="px-6 mb-6 relative" ref={brandRef}>
                        <p className="px-4 mb-2 text-[10px] font-black text-white/40 uppercase tracking-[0.4em]">Active Brand</p>
                        <button
                            onClick={() => setIsBrandSelectorOpen(!isBrandSelectorOpen)}
                            className="w-full flex items-center gap-4 p-4 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all duration-300 group"
                        >
                            <div className="w-8 h-8 rounded-lg bg-white/5 p-1.5 flex items-center justify-center border border-white/10 group-hover:border-indigo-500/30">
                                <img src={getBrandLogo(currentBrand)} alt="" className="w-full h-full object-contain logo-white" />
                            </div>
                            <div className="flex-1 text-left min-w-0">
                                <p className="text-xs font-bold text-white truncate uppercase tracking-tight">{currentBrand?.brand_name || 'Select Brand'}</p>
                            </div>
                            <i data-feather="chevron-down" className={`w-4 h-4 text-white/40 transition-transform duration-500 ${isBrandSelectorOpen ? 'rotate-180' : ''}`}></i>
                        </button>

                        {isBrandSelectorOpen && (
                            <div className="absolute top-full left-6 right-6 mt-2 py-2 z-50 animate-reveal-down bg-[var(--bg-main)] border border-white/10 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.6)] backdrop-blur-3xl overflow-hidden max-h-[300px] overflow-y-auto custom-scrollbar">
                                {brands.map((brand) => (
                                    <button
                                        key={brand.brand_id}
                                        onClick={() => {
                                            switchBrand(brand.brand_id);
                                            setIsBrandSelectorOpen(false);
                                        }}
                                        className={`w-full flex items-center gap-3 px-4 py-3 hover:bg-white/5 transition-colors text-left
                                            ${currentBrand?.brand_id === brand.brand_id ? 'bg-indigo-500/10' : ''}`}
                                    >
                                        <div className="w-6 h-6 rounded-md bg-white/5 p-1 flex items-center justify-center border border-white/10">
                                            <img src={getBrandLogo(brand)} alt="" className="w-full h-full object-contain logo-white" />
                                        </div>
                                        <span className={`text-[11px] font-bold uppercase tracking-wider 
                                            ${currentBrand?.brand_id === brand.brand_id ? 'text-indigo-400' : 'text-white/70'}`}>
                                            {brand.brand_name}
                                        </span>
                                        {currentBrand?.brand_id === brand.brand_id && (
                                            <div className="ml-auto w-1.5 h-1.5 rounded-full bg-indigo-500" />
                                        )}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* Primary Navigation Hierarchy */}
                <nav className="flex-1 px-4 py-2 space-y-1 overflow-y-auto custom-scrollbar">
                    {/* ROOT NODE: OVERVIEW */}

                    <div className="mb-2">
                        <button
                            onClick={() => {
                                setActiveView('benchmark');
                                if (location.pathname !== '/') navigate('/');
                            }}
                            className={`w-full group flex items-center gap-4 px-6 py-4 rounded-2xl transition-all duration-300 relative border
                                ${location.pathname === '/' && activeView === 'benchmark'
                                    ? 'bg-white/10 text-white border-white/20 shadow-lg'
                                    : 'text-white/70 hover:text-white hover:bg-white/5 border-transparent'}`}
                        >
                            {location.pathname === '/' && activeView === 'benchmark' && (
                                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-indigo-500 rounded-r-full shadow-[0_0_15px_rgba(99,102,241,0.5)]" />
                            )}
                            <div className={`p-2 rounded-xl transition-all duration-300 
                                ${location.pathname === '/' && activeView === 'benchmark' ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/20' : 'bg-white/5 text-white/60 group-hover:text-white'}`}>
                                <i data-feather="grid" className="w-5 h-5"></i>
                            </div>
                            <span className="text-sm font-bold tracking-tight uppercase">Overview</span>
                        </button>

                        <div className="mt-8 px-4 space-y-1">
                            <h2 className="text-[9.5px] font-black text-white/40 uppercase tracking-[0.4em] mb-4">Price Monitoring</h2>
                            {platforms.map((platform) => {
                                const isActive = location.pathname === platform.path;
                                return (
                                    <button
                                        key={platform.id}
                                        onClick={() => navigate(platform.path)}
                                        className={`w-full group flex items-center gap-4 px-6 py-4 rounded-2xl transition-all duration-300 relative border
                                            ${isActive ? 'bg-white/10 text-white border-white/20 shadow-lg' : 'text-white/70 hover:text-white hover:bg-white/5 border-transparent'}`}
                                    >
                                        {isActive && (
                                            <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1.5 h-8 bg-indigo-500 rounded-r-full shadow-[0_0_15px_rgba(99,102,241,0.5)]" />
                                        )}
                                        <div className={`p-2 rounded-xl transition-all duration-300 border
                                            ${isActive ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/20 border-indigo-400/20' : 'bg-white/5 text-white/60 group-hover:text-white border-transparent'}`}>
                                            <img src={platform.logo} alt={platform.label} className="w-5 h-5 object-contain" />
                                        </div>
                                        <span className="text-sm font-bold tracking-tight uppercase">
                                            {platform.label}
                                        </span>
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Secondary Navigation */}
                    <div className="mt-8 pt-6 border-t border-white/5 space-y-4">
                        <div className="px-6">
                            <h2 className="text-[9.5px] font-black text-white/40 uppercase tracking-[0.4em] mb-4">Analytics & Metrics</h2>

                            {/* Sales & Inventory Sub-section */}
                            <div className="space-y-1">
                                {analyticsItems.map((item) => {
                                    const isActive = location.pathname === item.path;
                                    return (
                                        <button
                                            key={item.id}
                                            onClick={() => navigate(item.path)}
                                            className={`w-full group flex items-center gap-4 px-6 py-3.5 rounded-2xl transition-all duration-300 relative border
                                                ${isActive ? 'bg-indigo-500/20 text-white border-indigo-500/30 shadow-lg' : 'text-zinc-400 hover:text-white hover:bg-white/5 border-transparent'}`}
                                        >
                                            <div className={`p-1.5 rounded-lg transition-all duration-300
                                                ${isActive ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/20' : 'bg-white/5 text-zinc-500 group-hover:text-white'}`}>
                                                <img src={item.logo} alt="" className={`w-4 h-4 object-contain ${!isActive ? 'opacity-50 grayscale group-hover:opacity-100 group-hover:grayscale-0' : ''}`} />
                                            </div>
                                            <span className={`text-[11px] font-bold tracking-tight uppercase ${isActive ? 'text-white' : 'text-zinc-500 group-hover:text-zinc-300'}`}>
                                                {item.label}
                                            </span>
                                        </button>
                                    );
                                })}
                            </div>

                            {/* Other Metrics */}
                            <div className="mt-4 space-y-1">
                                {secondaryItems.map((item) => {
                                    const isActive = location.pathname === item.path;
                                    return (
                                        <button
                                            key={item.id}
                                            onClick={() => navigate(item.path)}
                                            className={`w-full group flex items-center gap-4 px-6 py-3.5 rounded-2xl transition-all duration-300 border
                                                ${isActive ? 'bg-white/10 text-white border-white/20 shadow-lg' : 'text-zinc-400 hover:text-white hover:bg-white/5 border-transparent'}`}
                                        >
                                            <div className={`p-2 rounded-xl transition-all duration-300 
                                                ${isActive ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/20' : 'bg-white/5 text-zinc-500 group-hover:text-white'}`}>
                                                <i data-feather={item.icon} className="w-4 h-4"></i>
                                            </div>
                                            <span className={`text-[11px] font-bold tracking-tight uppercase ${isActive ? 'text-white' : 'text-zinc-500 group-hover:text-zinc-300'}`}>
                                                {item.label}
                                            </span>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                </nav>

                {/* User Profile */}
                <div className="p-4 border-t border-white/5 mt-auto relative" ref={profileRef}>
                    {isProfileOpen && (
                        <div className="absolute bottom-full left-0 mb-4 w-60 animate-reveal-up z-50 overflow-hidden bg-[var(--bg-main)] border border-white/10 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.6)] backdrop-blur-3xl">
                            <div className="px-5 py-4 border-b border-white/5 bg-white/[0.02]">
                                <p className="text-xs font-black text-white truncate tracking-wide">{profile?.full_name?.toUpperCase() || 'USER'}</p>
                                <div className="flex items-center gap-1.5 mt-1">
                                    <div className="w-1 h-1 rounded-full bg-indigo-500" />
                                    <p className="text-[9px] text-white/60 truncate uppercase tracking-[0.1em] font-bold">{profile?.role?.replace('_', ' ') || 'Member'}</p>
                                </div>
                            </div>
                            <div className="p-1.5 flex flex-col gap-1">
                                {isAdmin && (
                                    <button onClick={() => { setIsProfileOpen(false); navigate('/admin/users'); }} className="w-full flex items-center gap-3 px-3.5 py-3 rounded-xl transition-all duration-300 hover:bg-indigo-500/10 group">
                                        <div className="w-8 h-8 rounded-lg bg-indigo-500/5 group-hover:bg-indigo-500/20 flex items-center justify-center text-indigo-400">
                                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
                                                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                                                <circle cx="9" cy="7" r="4" />
                                                <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                                                <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                                            </svg>
                                        </div>
                                        <span className="text-[11px] font-bold text-white group-hover:text-white uppercase tracking-wider">Admin Panel</span>
                                    </button>
                                )}
                                <button onClick={async () => { setIsProfileOpen(false); if (signOut) await signOut(); navigate('/login', { replace: true }); }} className="w-full flex items-center gap-3 px-3.5 py-3 rounded-xl transition-all duration-300 hover:bg-red-500/10 group">
                                    <div className="w-8 h-8 rounded-lg bg-red-500/5 group-hover:bg-red-500/20 flex items-center justify-center text-red-400">
                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
                                            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                                            <polyline points="16 17 21 12 16 7" />
                                            <line x1="21" y1="12" x2="9" y2="12" />
                                        </svg>
                                    </div>
                                    <span className="text-[11px] font-bold text-white group-hover:text-red-400 uppercase tracking-wider">Sign Out</span>
                                </button>
                            </div>
                        </div>
                    )}

                    <button onClick={() => setIsProfileOpen(!isProfileOpen)} className={`w-full flex items-center gap-4 p-4 rounded-2xl transition-all duration-300 ${isProfileOpen ? 'bg-white/10' : 'hover:bg-white/5'}`}>
                        <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 p-[1px]">
                            <div className="w-full h-full rounded-full bg-[var(--bg-main)] flex items-center justify-center text-xs font-bold text-white uppercase">
                                {profile?.full_name?.charAt(0) || profile?.email?.charAt(0) || 'U'}
                            </div>
                        </div>
                        <div className="flex-1 text-left min-w-0">
                            <p className="text-sm font-bold text-white truncate">{profile?.full_name || 'User'}</p>
                            <p className="text-[10px] text-white/60 font-bold uppercase tracking-widest truncate">{profile?.role?.replace('_', ' ') || 'Member'}</p>
                        </div>
                        <i data-feather="settings" className={`w-4 h-4 text-white/60 transition-transform duration-500 ${isProfileOpen ? 'rotate-90' : ''}`}></i>
                    </button>
                </div>
            </div>
        </aside>
    );
}
