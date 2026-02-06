import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useDashboard } from '../contexts/DashboardContext';
import { getProducts, getBenchmarks } from '../services/productService';
import { getPricingCalendar } from '../services/pricingCalendarService';
import { isOutOfStock } from '../utils/csvParser';
import { getBrandLogo } from '../utils/brandUtils';
import Toast from '../components/Toast';
import feather from 'feather-icons';


export default function Home() {
  const { profile, currentBrand, loading: authLoading } = useAuth();
  const { activeView } = useDashboard();
  const [showToast, setShowToast] = useState(false);
  const [statsData, setStatsData] = useState({});
  const [loadingStats, setLoadingStats] = useState(false);
  const navigate = useNavigate();

  const platforms = useMemo(() => [
    { key: 'blinkit', name: 'Blinkit', logo: '/Blinkit-yellow-rounded.svg', accent: 'text-yellow-400', bg: 'bg-yellow-500/10', path: '/blinkit', color: '#eab308' },
    { key: 'instamart', name: 'Instamart', logo: '/instamart_logo.webp', accent: 'text-orange-400', bg: 'bg-orange-500/10', path: '/swiggy', color: '#f97316' },
    { key: 'zepto', name: 'Zepto', logo: '/zeptologo.webp', accent: 'text-purple-400', bg: 'bg-purple-500/10', path: '/zepto', color: '#a855f7' },
    { key: 'amazon', name: 'Amazon', logo: '/amazonlogo.png', accent: 'text-indigo-400', bg: 'bg-indigo-500/10', path: '/amazon', color: '#6366f1' }
  ], []);

  useEffect(() => {
    if (currentBrand) {
      fetchAllStats();
    }
  }, [currentBrand]);

  useEffect(() => {
    feather.replace();
  }, [activeView, loadingStats, statsData]);

  async function fetchAllStats() {
    if (!currentBrand) return;
    setLoadingStats(true);
    try {
      const today = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });
      const [benchmarksData, calendarData] = await Promise.all([
        getBenchmarks(currentBrand.brand_slug),
        getPricingCalendar({ brand: currentBrand.brand_slug, fromDate: today, toDate: today })
      ]);

      const results = {};
      await Promise.all(platforms.map(async (p) => {
        const [products] = await Promise.all([
          getProducts(p.key, currentBrand.brand_slug)
        ]);

        const mode = calendarData?.[today]?.[p.key] || 'BAU';
        const platformBenchmarks = benchmarksData[p.key] || {};

        // Calculate Current Compliance
        let compliantCount = 0;
        let totalValued = 0;

        products.forEach(item => {
          const bench = platformBenchmarks[item.product_id];
          if (!bench || !item.price) return;
          const reference = mode === 'EVENT' ? bench.event : bench.bau;
          if (reference === null || reference === undefined) return;
          totalValued++;
          if (Math.abs(item.price - reference) <= 1) compliantCount++;
        });


        const inStock = products.filter(item => !isOutOfStock(item.in_stock)).length;

        results[p.key] = {
          total: products.length,
          inStock,
          stockPercentage: products.length > 0 ? Math.round((inStock / products.length) * 100) : 0,
          mode,
          compliance: totalValued > 0 ? Math.round((compliantCount / totalValued) * 100) : 0
        };
      }));
      setStatsData(results);
    } catch (err) {
      console.error('Error fetching home stats:', err);
    } finally {
      setLoadingStats(false);
    }
  }

  const globalStats = useMemo(() => {
    const data = Object.values(statsData);
    if (data.length === 0) return { totalSku: 0, avgStock: 0 };
    const totalSku = data.reduce((acc, curr) => acc + curr.total, 0);
    const avgStock = Math.round(data.reduce((acc, curr) => acc + curr.stockPercentage, 0) / data.length);
    return { totalSku, avgStock };
  }, [statsData]);

  if (authLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="glass-card p-12 flex flex-col items-center animate-reveal">
          <div className="w-12 h-12 border-2 border-white/20 border-t-indigo-500 rounded-full animate-spin mb-4" />
          <p className="text-zinc-400 font-medium">Initializing Traben...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-10 flex-1 flex flex-col justify-start pt-[56px] pb-12">
      {activeView === 'benchmark' ? (
        <div className="animate-reveal w-full max-w-7xl mx-auto">
          {/* Header Section */}
          <header className="mb-12 flex flex-col items-start w-full">
            <h1 className="text-4xl font-medium text-white tracking-tight">
              Hi {profile?.full_name?.split(' ')[0] || 'Member'},
            </h1>
          </header>

          {/* Quick Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
            <div className="glass-card p-8 bg-indigo-500/5">
              <p className="text-[10px] font-black text-zinc-500 uppercase tracking-[.2em] mb-4">Total Active SKUs</p>
              <div className="flex items-end gap-3">
                <p className="text-5xl font-black text-white leading-none">{loadingStats ? '...' : globalStats.totalSku}</p>
                <div className="flex items-center gap-1 text-green-400 mb-1">
                  <i data-feather="arrow-up" className="w-3 h-3"></i>
                  <span className="text-[10px] font-bold uppercase tracking-widest">Global</span>
                </div>
              </div>
            </div>

            <div className="glass-card p-8 bg-purple-500/5">
              <p className="text-[10px] font-black text-zinc-500 uppercase tracking-[.2em] mb-4">Inventory Health</p>
              <div className="flex items-end gap-3">
                <p className="text-5xl font-black text-white leading-none">{loadingStats ? '...' : `${globalStats.avgStock}%`}</p>
                <div className="flex items-center gap-1 text-indigo-400 mb-1">
                  <i data-feather="activity" className="w-3 h-3"></i>
                  <span className="text-[10px] font-bold uppercase tracking-widest">Avg</span>
                </div>
              </div>
            </div>

            <div className="glass-card p-8 flex flex-col justify-center">
              <p className="text-[10px] font-black text-zinc-500 uppercase tracking-[.2em] mb-1">Current Brand</p>
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-white/5 p-2 flex items-center justify-center border border-white/10">
                  <img
                    src={getBrandLogo(currentBrand)}
                    alt={currentBrand?.brand_name}
                    className="w-full h-full object-contain logo-white"
                  />
                </div>
                <span className="text-xl font-bold text-white uppercase tracking-tight truncate">{currentBrand?.brand_name}</span>
              </div>
            </div>
          </div>

          {/* Channel Pulse Grid */}
          <section className="w-full">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-xs font-black text-zinc-600 uppercase tracking-[0.4em]">Channel Insights</h2>
              {loadingStats && <div className="text-[10px] font-bold text-indigo-400 animate-pulse uppercase tracking-widest">Refreshing Analysis...</div>}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {platforms.map((platform) => {
                const data = statsData[platform.key] || { total: 0, inStock: 0, stockPercentage: 0, mode: 'BAU', compliance: 0 };

                return (
                  <div
                    key={platform.key}
                    onClick={() => navigate(platform.path)}
                    className="glass-card product-card p-6 flex flex-col group cursor-pointer hover:border-indigo-500/30"
                  >
                    <div className="flex items-center justify-between mb-4">
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center p-2.5 bg-white/5 border border-white/10 group-hover:bg-white/10 transition-colors`}>
                        <img src={platform.logo} alt={platform.name} className="w-full h-full object-contain" />
                      </div>
                      <div className={`px-2.5 py-1 rounded-md text-[8px] font-black uppercase tracking-widest border
                            ${data.mode === 'EVENT' ? 'bg-indigo-500/10 border-indigo-500/30 text-indigo-400' : 'bg-green-500/10 border-green-500/30 text-green-400'}`}>
                        {data.mode} Day
                      </div>
                    </div>

                    <h3 className="text-lg font-bold text-white mb-2 tracking-tight uppercase">{platform.name}</h3>

                    <div className="space-y-3">
                      <div className="flex justify-between items-center text-zinc-500">
                        <span className="text-[9px] font-black uppercase tracking-widest">Compliance</span>
                        <span className={`text-[11px] font-bold ${data.compliance > 80 ? 'text-green-400' : 'text-yellow-400'}`}>
                          {loadingStats ? '...' : `${data.compliance}%`}
                        </span>
                      </div>
                      <div className="flex justify-between items-center text-zinc-500">
                        <span className="text-[9px] font-black uppercase tracking-widest">Inventory</span>
                        <span className="text-[11px] font-bold text-white">{loadingStats ? '...' : `${data.stockPercentage}%`}</span>
                      </div>
                    </div>

                    <div className="mt-auto pt-6 flex justify-between items-center">
                      <span className="text-[8px] font-black text-zinc-600 uppercase tracking-widest">{data.total} Active SKU</span>
                      <div className="p-1 rounded-md bg-white/5 text-zinc-600 group-hover:text-white transition-colors">
                        <i data-feather="arrow-right" className="w-3 h-3"></i>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        </div>
      ) : (
        <div className="animate-reveal py-20 flex flex-col items-center text-center">
          <div className="w-20 h-20 rounded-3xl bg-indigo-500/10 flex items-center justify-center mb-8 border border-white/5">
            <i data-feather="eye" className="w-10 h-10 text-indigo-400"></i>
          </div>
          <h2 className="text-4xl font-bold text-white mb-4">Competitor Tracking</h2>
          <p className="text-zinc-500 text-lg max-w-lg mx-auto font-medium">
            Our AI-driven competitor analysis engine is currently in the evolution phase. Soon you'll be able to trace every market move.
          </p>
          <div className="mt-12 flex gap-4">
            <div className="px-6 py-3 rounded-xl bg-white/5 border border-white/5 text-zinc-400 text-sm font-bold uppercase tracking-widest">
              Coming Q1 2026
            </div>
          </div>
        </div>
      )}

      <Toast
        message="Please select a brand first!"
        show={showToast}
        onClose={() => setShowToast(false)}
      />
    </div>
  );
}
