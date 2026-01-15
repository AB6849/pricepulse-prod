import { useState, useEffect, useMemo, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { isOutOfStock } from '../utils/csvParser';
import { getProducts, getBenchmarks } from '../services/productService';
import { getPricingCalendar } from '../services/pricingCalendarService';

export default function Zepto() {
    const { currentBrand, loading: authLoading, brands } = useAuth();
    const brandSlug = currentBrand?.brand_slug || 'petcrux';

    const [products, setProducts] = useState([]);
    const [benchmarks, setBenchmarks] = useState({});
    const [searchQuery, setSearchQuery] = useState('');
    const [sortBy, setSortBy] = useState('name');
    const [filterBy, setFilterBy] = useState('all');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [displayLimit, setDisplayLimit] = useState(50);
    const [isLoadingMore, setIsLoadingMore] = useState(false);
    const observerTarget = useRef(null);
    const hasHydratedFromCache = useRef(false);
    const [pricingMode, setPricingMode] = useState('BAU');

    useEffect(() => {
  const handleVisibilityChange = () => {
    if (document.visibilityState === 'hidden') {
      sessionStorage.setItem('zepto-scroll', window.scrollY);
    }
  };

  window.addEventListener('visibilitychange', handleVisibilityChange);

  return () => {
    window.removeEventListener('visibilitychange', handleVisibilityChange);
  };
}, []);

useEffect(() => {
  const cached = sessionStorage.getItem(`zepto-cache-${brandSlug}`);

  if (cached) {
    const parsed = JSON.parse(cached);

    setProducts(parsed.products || []);
    setBenchmarks(parsed.benchmarks || {});
    setPricingMode(parsed.pricingMode || 'BAU');
    setDisplayLimit(parsed.displayLimit || 50);

    setLoading(false);
    hasHydratedFromCache.current = true;
    return;
  }
}, [brandSlug]);

useEffect(() => {
  if (!loading && products.length && hasHydratedFromCache.current) {
    const y = sessionStorage.getItem('zepto-scroll');
    if (y) {
      requestAnimationFrame(() => {
        window.scrollTo(0, Number(y));
      });
    }
  }
}, [loading, products.length]);

        useEffect(() => {
  if (authLoading || hasHydratedFromCache.current) return;
    
            if (!currentBrand && brands && brands.length === 0) {
                setError('No brands assigned. Contact admin to get access.');
                setLoading(false);
                return;
            }
    
            if (currentBrand || brandSlug) {
                fetchData();
            }
        }, [currentBrand, authLoading, brands, brandSlug]);
    
        // Reset display limit when filters change
        useEffect(() => {
            setDisplayLimit(50);
            setIsLoadingMore(false);
        }, [searchQuery, filterBy, sortBy]);
    
        async function fetchData() {
            try {
                setLoading(true);
                setError(null);
    
                const today = new Date().toLocaleDateString('en-CA', {
                    timeZone: 'Asia/Kolkata'
                }); // YYYY-MM-DD
    
                const [productsData, benchmarksData, calendarData] = await Promise.all([
                    getProducts('zepto', brandSlug),
                    getBenchmarks(brandSlug),
                    getPricingCalendar({
                        brand: brandSlug,
                        fromDate: today,
                        toDate: today
                    })
                ]);
    
    
                setProducts(productsData);

                // benchmarksData now = { zepto: { productName: { bau, event } } }
                setBenchmarks(benchmarksData.zepto || {});
    
                // Determine today's pricing mode
                const modeForToday =
                    calendarData?.[today]?.zepto || 'BAU';

                setPricingMode(modeForToday);
    
            } catch (err) {
                console.error('Error fetching data:', err);
                setError('Failed to load products: ' + err.message);
            } finally {
                setLoading(false);
            }
        }

        useEffect(() => {
  if (!products.length) return;

  sessionStorage.setItem(
    `zepto-cache-${brandSlug}`,
    JSON.stringify({
      products,
      benchmarks,
      pricingMode,
      displayLimit
    })
  );
}, [products, benchmarks, pricingMode, displayLimit, brandSlug]);

    const { filteredProducts, displayedProducts } = useMemo(() => {
            let filtered = products;
    
            if (searchQuery) {
                const query = searchQuery.toLowerCase();
                filtered = filtered.filter(p => p.name?.toLowerCase().includes(query));
            }
    
            if (filterBy === 'instock') {
                filtered = filtered.filter(p => !isOutOfStock(p.in_stock));
            } else if (filterBy === 'oos') {
                filtered = filtered.filter(p => isOutOfStock(p.in_stock));
            } else if (filterBy !== 'all') {
    
            }
    
            const sorted = filtered.sort((a, b) => {
                if (sortBy === 'name') return (a.name || '').localeCompare(b.name || '');
                if (sortBy === 'price') return (a.price || 0) - (b.price || 0);
                if (sortBy === 'price-desc') return (b.price || 0) - (a.price || 0);
                if (sortBy === 'diff' || sortBy === 'diff-desc') {
                    const getDiff = (p) => {
                        const bench = benchmarks?.[p.product_id];
                        if (!bench || !p.price) return 0;
    
                        const reference =
                            pricingMode === 'EVENT' ? bench.event : bench.bau;
    
                        if (reference === null || reference === undefined) return 0;
    
                        return p.price - reference;
                    };
    
                    return sortBy === 'diff'
                        ? getDiff(a) - getDiff(b)
                        : getDiff(b) - getDiff(a);
                }
    
                return 0;
            });
    
            return {
                filteredProducts: sorted,
                displayedProducts: sorted.slice(0, displayLimit)
            };
        }, [products, searchQuery, filterBy, sortBy, benchmarks, pricingMode, displayLimit]);
    
    const stats = useMemo(() => ({
            total: products.length,
            inStock: products.filter(p => !isOutOfStock(p.in_stock)).length,
            outOfStock: products.filter(p => isOutOfStock(p.in_stock)).length,
            displayed: filteredProducts.length
        }), [products, filteredProducts]);
    
        // Infinite scroll with Intersection Observer
        useEffect(() => {
            const hasMore = displayedProducts.length < stats.displayed;
            if (!hasMore || isLoadingMore) {
                return;
            }
    
            let observer = null;
            let timeoutId = null;
    
            timeoutId = setTimeout(() => {
                const currentTarget = observerTarget.current;
                if (!currentTarget) {
                    return;
                }
    
                observer = new IntersectionObserver(
                    (entries) => {
                        const entry = entries[0];
                        if (entry.isIntersecting && !isLoadingMore) {
                            if (displayedProducts.length < stats.displayed) {
                                setIsLoadingMore(true);
                                setDisplayLimit(prev => {
                                    const newLimit = Math.min(prev + 50, stats.displayed);
                                    return newLimit;
                                });
                                setTimeout(() => {
                                    setIsLoadingMore(false);
                                }, 500);
                            }
                        }
                    },
                    {
                        threshold: 0.1,
                        rootMargin: '500px'
                    }
                );
    
                observer.observe(currentTarget);
            }, 200);

        return () => {
                    if (timeoutId) {
                        clearTimeout(timeoutId);
                    }
                    if (observer) {
                        observer.disconnect();
                    }
                };
            }, [displayedProducts.length, stats.displayed, isLoadingMore, displayLimit]);
        
            if (authLoading) {
                return (
                    <div className="min-h-screen">
                        <Header />
                        <main className="container mx-auto px-4 py-8">
                            <div className="text-center py-12">
                                <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                                <p className="text-gray-400">Loading...</p>
                            </div>
                        </main>
                        <Footer />
                    </div>
                );
            }
        
            if (error) {
                return (
                    <div className="min-h-screen">
                        <Header />
                        <main className="container mx-auto px-4 py-8">
                            <div className="bg-red-500/20 border border-red-500/50 text-red-300 px-6 py-4 rounded-lg text-center">
                                <p className="text-lg font-semibold mb-2">{error}</p>
                                <p className="text-sm">Please contact your administrator to get brand access.</p>
                            </div>
                        </main>
                        <Footer />
                    </div>
                );
            }
        
            return (
                <div className="min-h-screen" key="zepto-v1">
                    <Header />
                    <main className="container mx-auto px-4 py-6 max-w-7xl">
                        {/* Compact Header */}
                        <div className="flex items-center justify-between mb-6">
                            <div className="flex items-center gap-3">
                                <img src="/zeptologo.webp" alt="Zepto" className="w-10 h-10" />
                                <div>
                                    <h1 className="text-2xl font-bold text-white">Zepto</h1>
                                    {currentBrand && <p className="text-xs text-gray-400">{currentBrand.brand_name}</p>}
                                </div>
                            </div>
        
                            <div className="flex gap-2 text-xs items-center">
                                <div className="text-xs px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
                                    {pricingMode} DAY
                                </div>
        
                                <div className="bg-white/5 px-3 py-1.5 rounded-lg border border-white/10">
                                    <span className="text-gray-400">Total:</span>
                                    <span className="text-white font-semibold ml-1">{stats.total}</span>
                                </div>
                                <div className="bg-green-500/10 px-3 py-1.5 rounded-lg border border-green-500/30">
                                    <span className="text-green-400">{stats.inStock}</span>
                                </div>
                                <div className="bg-red-500/10 px-3 py-1.5 rounded-lg border border-red-500/30">
                                    <span className="text-red-400">{stats.outOfStock}</span>
                                </div>
                            </div>
        
                        </div>
        
                        {/* Compact Controls */}
                        <div className="bg-white/5 backdrop-blur-lg rounded-xl p-3 mb-6 border border-white/10">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                                <input
                                    type="text"
                                    placeholder="Search..."
                                    className="px-3 py-2 rounded-lg bg-white/10 border border-white/20 text-white text-sm placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                />
                                <select
                                    className="px-3 py-2 rounded-lg bg-white/10 border border-white/20 text-white text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500"
                                    value={sortBy}
                                    onChange={(e) => setSortBy(e.target.value)}
                                >
                                    <option value="name">Name</option>
                                    <option value="price">Price ↑</option>
                                    <option value="price-desc">Price ↓</option>
                                    <option value="diff">Diff ↑</option>
                                    <option value="diff-desc">Diff ↓</option>
                                </select>
                                <select
                                    className="px-3 py-2 rounded-lg bg-white/10 border border-white/20 text-white text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500"
                                    value={filterBy}
                                    onChange={(e) => setFilterBy(e.target.value)}
                                >
                                    <option value="all">All</option>
                                    <option value="instock">In Stock</option>
                                    <option value="oos">Out of Stock</option>
                                    <option value="above">Above Bench</option>
                                    <option value="below">Below Bench</option>
                                    <option value="at">At Bench</option>
                                </select>
                            </div>
                        </div>
        
                        {/* Products Grid */}
                        {loading ? (
                            <div className="text-center py-20">
                                <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                                <p className="text-gray-400">Loading...</p>
                            </div>
                        ) : displayedProducts.length === 0 ? (
                            <div className="text-center py-20">
                                <p className="text-gray-400 text-lg">No products found</p>
                                {searchQuery && (
                                    <button onClick={() => setSearchQuery('')} className="mt-4 text-indigo-400">Clear search</button>
                                )}
                            </div>
                        ) : (
                            <>
                                <div className="flex justify-between items-center mb-3">
                                    <p className="text-gray-400 text-xs">Showing {displayedProducts.length} of {stats.displayed} products</p>
                                </div>
                                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
                                    {displayedProducts.map((product, idx) => {
                                        const benchmark =
                                            benchmarks?.[product.product_id];
        
                                        const referencePrice =
                                            pricingMode === 'EVENT'
                                                ? benchmark?.event
                                                : benchmark?.bau;
        
                                        const hasBenchmark =
                                            referencePrice !== null &&
                                            referencePrice !== undefined;
        
                                        const priceDiff =
                                            hasBenchmark && product.price
                                                ? product.price - referencePrice
                                                : null;
        
                                        const isOOS = isOutOfStock(product.in_stock);
                                        let statusLabel = 'Benchmark Missing';
                                        let statusClass = 'bg-gray-500/20 text-gray-400 border border-gray-500/30';
        
                                        if (hasBenchmark && priceDiff !== null) {
                                            if (Math.abs(priceDiff) < 1) {
                                                statusLabel = `Correct (${pricingMode})`;
                                                statusClass = 'bg-green-500/20 text-green-400 border border-green-500/30';
                                            } else if (priceDiff > 0) {
                                                statusLabel = `Above ${pricingMode} (+₹${priceDiff.toFixed(0)})`;
                                                statusClass = 'bg-red-500/20 text-red-400 border border-red-500/30';
                                            } else {
                                                statusLabel = `Below ${pricingMode} (-₹${Math.abs(priceDiff).toFixed(0)})`;
                                                statusClass = 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30';
                                            }
                                        }
        
                                        return (
                                            <a
  href={product.url}
  target="_blank"
  rel="noopener noreferrer"
  onClick={() => {
    sessionStorage.setItem('zepto-scroll', window.scrollY);
  }}
  className="block group"
>

                                                <div
                                                    className="bg-white/5 rounded-lg border border-white/10 overflow-hidden hover:border-indigo-500/50 transition-all duration-150 hover:shadow-lg hover:shadow-indigo-500/20"
                                                >
                                                    <div className="relative h-32 bg-white/5">
                                                        <img
                                                            src={product.image}
                                                            alt={product.name}
                                                            loading="lazy"
                                                            className="w-full h-full object-contain p-2"
                                                        />
                                                        {isOOS && (
                                                            <div className="absolute top-1 right-1 bg-red-500 text-white text-[10px] px-1.5 py-0.5 rounded-full font-semibold">
                                                                OOS
                                                            </div>
                                                        )}
                                                        {hasBenchmark && priceDiff !== null && Math.abs(priceDiff) > 0.01 && (
                                                            <div className={`absolute top-1 left-1 text-[10px] px-1.5 py-0.5 rounded-full font-semibold ${priceDiff < 0 ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
                                                                }`}>
                                                                {priceDiff < 0 ? '-' : '+'}{Math.abs(priceDiff).toFixed(0)}
                                                            </div>
                                                        )}
                                                    </div>
        
                                                    <div className="p-2">
                                                        <h3 className="text-white text-xs font-medium mb-1 line-clamp-2" style={{ minHeight: '2rem' }}>
                                                            {product.name}
                                                        </h3>
        
                                                        {product.unit && (
                                                            <p className="text-gray-400 text-[10px] mb-2">{product.unit}</p>
                                                        )}
        
                                                        <div className="space-y-1.5">
                                                            {/* Price + MRP */}
                                                            <div className="flex items-center gap-2">
                                                                <p className="text-green-400 text-lg font-bold">₹{product.price}</p>
                                                                {product.original_price && product.original_price !== product.price && (
                                                                    <p className="text-gray-400 text-xs line-through">MRP ₹{product.original_price}</p>
                                                                )}
                                                            </div>
        
                                                            {/* vs Benchmark Status - Bottom Badge */}
                                                            <div
                                                                className={`text-center text-[10px] px-2 py-1.5 rounded font-semibold border ${statusClass}`}
                                                            >
                                                                {statusLabel}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </a>
                                        );
                                    })}
                                </div>
        
                                {/* Sentinel element for infinite scroll */}
                                {displayedProducts.length < stats.displayed && (
                                    <div
                                        ref={observerTarget}
                                        className="py-12 flex justify-center items-center"
                                        style={{ minHeight: '150px' }}
                                    >
                                        {isLoadingMore ? (
                                            <div className="flex items-center gap-2 text-gray-400">
                                                <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
                                                <span className="text-sm">Loading more products...</span>
                                            </div>
                                        ) : (
                                            <div className="h-20 w-full" aria-hidden="true"></div>
                                        )}
                                    </div>
                                )}
                            </>
                        )}
                    </main>
                    <Footer />
                </div>
            );
        }