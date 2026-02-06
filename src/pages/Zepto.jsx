import { useState, useEffect, useMemo, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useAuth } from '../contexts/AuthContext';
import { isOutOfStock } from '../utils/csvParser';
import { getProducts, getBenchmarks } from '../services/productService';
import { getPricingCalendar } from '../services/pricingCalendarService';
import PriceHistoryChart from '../components/PriceHistoryChart';
import feather from 'feather-icons';

function toTitleCase(str) {
    if (!str) return str;
    return str.replace(/\w\S*/g, word =>
        word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
    );
}

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
    const [historyProduct, setHistoryProduct] = useState(null);

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
        } else if (filterBy === 'above' || filterBy === 'below' || filterBy === 'at') {
            filtered = filtered.filter(p => {
                const bench = benchmarks?.[p.product_id];
                if (!bench || !p.price) return false;

                const reference =
                    pricingMode === 'EVENT' ? bench.event : bench.bau;

                if (reference === null || reference === undefined) return false;

                const diff = p.price - reference;

                if (filterBy === 'above') return diff > 1;
                if (filterBy === 'below') return diff < -1;
                if (filterBy === 'at') return Math.abs(diff) <= 1;

                return true;
            });
        }


        const sorted = [...filtered].sort((a, b) => {
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

    useEffect(() => {
        feather.replace();
    }, [displayedProducts, loading, historyProduct]);

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
            <div className="flex-1 flex items-center justify-center">
                <div className="glass-card p-12 flex flex-col items-center animate-reveal">
                    <div className="w-12 h-12 border-2 border-white/20 border-t-indigo-500 rounded-full animate-spin mb-4" />
                    <p className="text-zinc-400 font-medium tracking-wide uppercase text-[10px]">Syncing Data...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex-1 flex items-center justify-center p-6">
                <div className="glass-card p-10 flex flex-col items-center text-center animate-reveal max-w-md border-red-500/20">
                    <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center mb-6">
                        <i data-feather="alert-circle" className="w-8 h-8 text-red-400"></i>
                    </div>
                    <h2 className="text-xl font-bold text-white mb-2 tracking-tight">{error}</h2>
                    <p className="text-zinc-500 text-sm font-medium mb-8">Please contact your administrator to get brand access.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="container mx-auto px-10 pt-[56px] pb-8 flex-1 flex flex-col" key="zepto-v1">
            {/* Compact Header */}
            <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 mb-10 overflow-hidden">
                <div className="flex items-center gap-5">
                    <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center p-3 shadow-xl shadow-black/20">
                        <img src="/zeptologo.webp" alt="Zepto" className="w-full h-full object-contain" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-medium text-white tracking-tight">Zepto Tracking</h1>
                        {currentBrand && <p className="text-zinc-500 font-bold uppercase text-[10px] tracking-[0.2em] mt-1">{currentBrand.brand_name}</p>}
                    </div>
                </div>

                <div className="flex flex-wrap gap-3">
                    <div className="glass-card px-4 py-2 flex items-center gap-3">
                        <div className="w-2 h-2 rounded-full bg-indigo-500 shadow-[0_0_12px_rgba(99,102,241,0.8)] animate-pulse" />
                        <span className="text-[10px] font-black uppercase tracking-widest text-indigo-400">{pricingMode} DAY</span>
                    </div>

                    <div className="glass-card px-4 py-2 flex items-center gap-4">
                        <div className="flex flex-col">
                            <span className="text-[8px] font-black text-zinc-500 uppercase tracking-widest">Total SKU</span>
                            <span className="text-sm font-bold text-white">{stats.total}</span>
                        </div>
                        <div className="w-[1px] h-6 bg-white/5" />
                        <div className="flex flex-col">
                            <span className="text-[8px] font-black text-green-500 uppercase tracking-widest">In Stock</span>
                            <span className="text-sm font-bold text-green-400">{stats.inStock}</span>
                        </div>
                        <div className="w-[1px] h-6 bg-white/5" />
                        <div className="flex flex-col">
                            <span className="text-[8px] font-black text-red-500 uppercase tracking-widest">OOS</span>
                            <span className="text-sm font-bold text-red-400">{stats.outOfStock}</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Filters Header */}
            <header className="glass-card mb-10 p-2 flex flex-col md:flex-row gap-4 items-center">
                <div className="flex-1 w-full relative group">
                    <i data-feather="search" className="absolute left-6 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500 group-hover:text-indigo-400 transition-colors"></i>
                    <input
                        type="text"
                        placeholder="SEARCH SKU..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full bg-white/5 border border-transparent focus:border-indigo-500/30 rounded-2xl py-4 pl-14 pr-6 text-[10px] font-black uppercase tracking-widest text-white placeholder:text-zinc-600 transition-all outline-none"
                    />
                </div>

                <div className="flex gap-2 w-full md:w-auto">
                    <select
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value)}
                        className="flex-1 md:w-64 bg-white/5 border border-transparent focus:border-indigo-500/30 rounded-2xl py-4 px-6 text-[10px] font-black uppercase tracking-widest text-white outline-none cursor-pointer appearance-none transition-all"
                    >
                        <option value="name">SORT BY NAME</option>
                        <option value="price">PRICE LOW TO HIGH</option>
                        <option value="price-desc">PRICE HIGH TO LOW</option>
                        <option value="diff">BENCHMARK DIFF ↑</option>
                        <option value="diff-desc">BENCHMARK DIFF ↓</option>
                    </select>

                    <select
                        value={filterBy}
                        onChange={(e) => setFilterBy(e.target.value)}
                        className="flex-1 md:w-64 bg-white/5 border border-transparent focus:border-indigo-500/30 rounded-2xl py-4 px-6 text-[10px] font-black uppercase tracking-widest text-white outline-none cursor-pointer appearance-none transition-all"
                    >
                        <option value="all">ALL PRODUCTS</option>
                        <option value="instock">IN STOCK ONLY</option>
                        <option value="oos">OUT OF STOCK</option>
                        <option value="above">ABOVE BENCHMARK</option>
                        <option value="below">BELOW BENCHMARK</option>
                        <option value="at">MATCHING BENCHMARK</option>
                    </select>
                </div>
            </header>

            {/* Products Grid */}
            <div className="flex-1">
                {loading ? (
                    <div className="flex flex-col items-center justify-center py-24">
                        <div className="w-10 h-10 border-2 border-white/10 border-t-indigo-500 rounded-full animate-spin mb-4"></div>
                        <p className="text-zinc-500 text-[10px] font-black uppercase tracking-widest">Crawling Data...</p>
                    </div>
                ) : displayedProducts.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-24 text-center glass-card">
                        <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-6">
                            <i data-feather="package" className="w-8 h-8 text-zinc-600"></i>
                        </div>
                        <h3 className="text-white font-bold mb-2 uppercase tracking-widest text-xs">No products found</h3>
                        <p className="text-zinc-500 text-[10px] font-medium max-w-xs mx-auto mb-6">Adjust your filters or try a different search term to find what you're looking for.</p>
                        {searchQuery && (
                            <button onClick={() => setSearchQuery('')} className="text-indigo-400 font-black uppercase tracking-widest text-[10px] hover:text-indigo-300 transition-colors">Clear Search</button>
                        )}
                    </div>
                ) : (
                    <>
                        <div className="flex justify-between items-center mb-6 px-1">
                            <p className="text-zinc-500 text-[10px] font-black uppercase tracking-[0.2em]">SKU Catalog / <span className="text-zinc-300">{displayedProducts.length} results</span></p>
                        </div>
                        <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6">
                            {displayedProducts.map((product) => {
                                const benchmark = benchmarks?.[product.product_id];
                                const referencePrice = pricingMode === 'EVENT' ? benchmark?.event : benchmark?.bau;
                                const hasBenchmark = referencePrice !== null && referencePrice !== undefined;
                                const priceDiff = hasBenchmark && product.price ? product.price - referencePrice : null;
                                const isOOS = isOutOfStock(product.in_stock);

                                let statusLabel = 'BENCHMARK MISSING';
                                let statusClass = 'text-zinc-500 border-white/5 bg-white/[0.02]';

                                if (hasBenchmark && priceDiff !== null) {
                                    if (Math.abs(priceDiff) < 1) {
                                        statusLabel = `CORRECT (${pricingMode})`;
                                        statusClass = 'text-green-400 border-green-500/20 bg-green-500/5 shadow-[0_0_15px_rgba(34,197,94,0.1)]';
                                    } else if (priceDiff > 0) {
                                        statusLabel = `ABOVE BENCH (+₹${priceDiff.toFixed(0)})`;
                                        statusClass = 'text-red-400 border-red-500/20 bg-red-500/5';
                                    } else {
                                        statusLabel = `BELOW BENCH (-₹${Math.abs(priceDiff).toFixed(0)})`;
                                        statusClass = 'text-yellow-400 border-yellow-500/20 bg-yellow-500/5';
                                    }
                                }

                                return (
                                    <a
                                        key={product.product_id}
                                        href={product.url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        onClick={() => sessionStorage.setItem('zepto-scroll', window.scrollY)}
                                        className="group"
                                    >
                                        <div className="glass-card product-card flex flex-col h-full hover:shadow-lg hover:shadow-indigo-500/5 relative">
                                            <div className="aspect-square bg-white/[0.02] p-6 relative flex items-center justify-center overflow-hidden">
                                                <img
                                                    src={product.image}
                                                    alt={product.name}
                                                    loading="lazy"
                                                    decoding="async"
                                                    className="w-full h-full object-contain product-image-blend"
                                                />
                                                {isOOS && (
                                                    <div className="absolute top-3 right-3 bg-red-500 text-white text-[9px] px-2 py-1 rounded-md font-black uppercase tracking-widest shadow-lg shadow-black/40">
                                                        OOS
                                                    </div>
                                                )}
                                                {hasBenchmark && priceDiff !== null && Math.abs(priceDiff) > 0.01 && (
                                                    <div className={`absolute top-3 left-3 text-[9px] px-2 py-1 rounded-md font-black uppercase tracking-widest shadow-lg ${priceDiff < 0 ? 'bg-green-500' : 'bg-red-500'} text-white`}>
                                                        {priceDiff < 0 ? '-' : '+'}{Math.abs(priceDiff).toFixed(0)}
                                                    </div>
                                                )}
                                            </div>

                                            <div className="p-5 flex flex-col flex-1">
                                                <h3 className="text-white text-xs font-bold mb-1 line-clamp-2 leading-relaxed tracking-tight group-hover:text-indigo-400 transition-colors" style={{ minHeight: '2.4rem' }}>
                                                    {toTitleCase(product.name)}
                                                </h3>

                                                <div className="flex items-center gap-2 mb-4 opacity-50">
                                                    <span className="text-[9px] font-black uppercase tracking-widest text-zinc-400">
                                                        {product.unit || 'Standard Pack'}
                                                    </span>
                                                </div>

                                                <div className="mt-auto pt-4 border-t border-white/5 flex flex-col gap-4">
                                                    <div className="flex items-end justify-between">
                                                        <div className="flex flex-col">
                                                            <span className="text-[8px] font-black text-zinc-500 uppercase tracking-widest mb-0.5">Price</span>
                                                            <div className="flex items-center gap-2">
                                                                <p className="text-xl font-black text-white leading-none">₹{product.price}</p>
                                                                <button
                                                                    onClick={(e) => {
                                                                        e.preventDefault();
                                                                        e.stopPropagation();
                                                                        setHistoryProduct(product);
                                                                    }}
                                                                    className="p-2 bg-indigo-500/10 hover:bg-indigo-500/20 rounded-xl transition-all group/history border border-indigo-500/20"
                                                                >
                                                                    <i data-feather="trending-up" className="w-4 h-4 text-indigo-400 group-hover/history:scale-110 transition-transform"></i>
                                                                </button>
                                                            </div>
                                                        </div>
                                                        {product.original_price && product.original_price !== product.price && (
                                                            <p className="text-[10px] text-zinc-500 line-through font-bold">₹{product.original_price}</p>
                                                        )}
                                                    </div>

                                                    <div className={`text-center text-[9px] px-3 py-2 rounded-lg font-black uppercase tracking-widest border transition-all ${statusClass}`}>
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
                            <div ref={observerTarget} className="py-20 flex flex-col justify-center items-center">
                                {isLoadingMore ? (
                                    <div className="flex flex-col items-center gap-4">
                                        <div className="w-10 h-10 border-2 border-white/10 border-t-indigo-500 rounded-full animate-spin"></div>
                                        <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Loading SKU Batch...</span>
                                    </div>
                                ) : (
                                    <div className="h-10 w-full" aria-hidden="true"></div>
                                )}
                            </div>
                        )}
                    </>
                )}
            </div>
            {/* Price History Modal */}
            {/* Price History Modal - Portaled to Body for correct positioning */}
            {historyProduct && createPortal(
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setHistoryProduct(null)}></div>
                    <div className="glass-card glass-panel w-full max-w-lg p-8 relative animate-reveal-up overflow-hidden">
                        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 to-purple-500"></div>
                        <PriceHistoryChart
                            productId={historyProduct.product_id}
                            internalId={historyProduct.id}
                            platform="zepto"
                            brand={brandSlug}
                            currentPrice={historyProduct.price}
                            onClose={() => setHistoryProduct(null)}
                        />
                    </div>
                </div>,
                document.body
            )}
        </div>
    );
}