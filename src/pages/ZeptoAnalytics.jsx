import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useDashboard } from '../contexts/DashboardContext';
import { useSearchParams } from 'react-router-dom';
import CSVUploader from '../components/CSVUploader';
import TrabenLoader from '../components/TrabenLoader';
import {
    parseCSV,
    uploadSalesData,
    uploadInventoryData,
    getSalesSummaryByProduct,
    getSalesByCity,
    calculateStockoutRisk,
    getDailySalesTrend,
    getInventoryByFacility,
    getNuclearInsights,
    getCompleteAnalytics,
    checkExistingDates
} from '../services/analyticsService';
import {
    LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    BarChart, Bar, PieChart, Pie, Cell
} from 'recharts';
import feather from 'feather-icons';

const COLORS = ['#6366f1', '#8b5cf6', '#a855f7', '#d946ef', '#ec4899', '#f43f5e'];

// Format number in Indian style (Lakhs, Crores)
function formatIndianCurrency(num) {
    const val = num || 0;
    if (val >= 10000000) {
        return `₹${(val / 10000000).toFixed(2)} Cr`;
    } else if (val >= 100000) {
        return `₹${(val / 100000).toFixed(2)} L`;
    } else if (val >= 1000) {
        return `₹${(val / 1000).toFixed(1)}K`;
    } else {
        return `₹${val.toFixed(0)}`;
    }
}

// Format plain number in Indian style
function formatIndianNumber(num) {
    const val = num || 0;
    if (val >= 10000000) {
        return `${(val / 10000000).toFixed(2)} Cr`;
    } else if (val >= 100000) {
        return `${(val / 100000).toFixed(2)} L`;
    } else if (val >= 1000) {
        return `${(val / 1000).toFixed(1)}K`;
    } else {
        return val.toLocaleString('en-IN');
    }
}

export default function ZeptoAnalytics() {
    const { user, currentBrand } = useAuth();
    const brandSlug = currentBrand?.brand_slug;
    const [searchParams, setSearchParams] = useSearchParams();

    // Read initial tab from URL, default to 'sales'
    const [activeTab, setActiveTab] = useState(searchParams.get('tab') || 'sales');
    const [loading, setLoading] = useState(false);
    const [salesSummary, setSalesSummary] = useState([]);
    const [citySales, setCitySales] = useState([]);
    const [stockoutRisk, setStockoutRisk] = useState([]);
    const [dailyTrend, setDailyTrend] = useState([]);
    const [stats, setStats] = useState({ totalSales: 0, totalRevenue: 0, uniqueProducts: 0, riskItems: 0, citiesCovered: 0 });
    const [facilityInventory, setFacilityInventory] = useState([]);
    const [facilityStatusFilter, setFacilityStatusFilter] = useState('all');
    const [inventorySearchQuery, setInventorySearchQuery] = useState('');
    const [nuclearData, setNuclearData] = useState(null);
    const [dataLoaded, setDataLoaded] = useState(false);
    const [nuclearSort, setNuclearSort] = useState({ column: 'doh', order: 'asc' });

    useEffect(() => {
        const timer = setTimeout(() => {
            try {
                if (typeof feather !== 'undefined') {
                    feather.replace();
                }
            } catch (e) {
                console.error('Feather error:', e);
            }
        }, 100);
        return () => clearTimeout(timer);
    }, [activeTab, loading, nuclearSort]);

    // Robust sorting logic
    const sortedNuclearItems = useMemo(() => {
        if (!nuclearData?.items) return [];
        try {
            return [...nuclearData.items].sort((a, b) => {
                const column = nuclearSort.column;
                const isAsc = nuclearSort.order === 'asc' ? 1 : -1;

                let valA = a[column];
                let valB = b[column];

                if (valA === valB) return 0;

                // Handle nulls/undefined
                if (valA === null || valA === undefined) return 1;
                if (valB === null || valB === undefined) return -1;

                if (typeof valA === 'string' && typeof valB === 'string') {
                    return valA.localeCompare(valB) * isAsc;
                }

                return (valA > valB ? 1 : -1) * isAsc;
            });
        } catch (e) {
            console.error('Nuclear sort error:', e);
            return nuclearData.items;
        }
    }, [nuclearData, nuclearSort]);

    // Prefetch data on component mount for instant tab switching
    useEffect(() => {
        if (brandSlug) {
            setDataLoaded(false); // Reset to force re-fetch
            loadAnalytics();
        }
    }, [brandSlug]);

    const loadAnalytics = async () => {
        if (!brandSlug) return;
        setLoading(true);
        // Clear previous data while loading to prevent brand leakage
        setSalesSummary([]);
        setCitySales([]);
        setStockoutRisk([]);
        setDailyTrend([]);
        setFacilityInventory([]);
        setNuclearData(null);

        try {
            const { summary, cities, risk, trend, facilities, nuclear } = await getCompleteAnalytics('zepto', brandSlug);

            setSalesSummary(summary);
            setCitySales(cities);
            setStockoutRisk(risk);
            setDailyTrend(trend);
            setFacilityInventory(facilities);
            setNuclearData(nuclear);

            // Calculate stats
            const totalSales = summary.reduce((sum, p) => sum + p.total_qty, 0);
            const totalRevenue = summary.reduce((sum, p) => sum + p.total_revenue, 0);

            // Count distinct cities
            const citiesCovered = cities.length;

            setStats({
                totalSales,
                totalRevenue,
                uniqueProducts: summary.length,
                citiesCovered,
                riskItems: risk.length
            });
            setDataLoaded(true);
        } catch (error) {
            console.error('Failed to load analytics:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleUpload = async (file, type) => {
        const rows = await parseCSV(file);

        if (type === 'sales') {
            return await uploadSalesData('zepto', brandSlug, rows, user.id);
        } else {
            return await uploadInventoryData('zepto', brandSlug, rows, user.id);
        }
    };

    const handleCheckOverlap = async (file, type) => {
        const rows = await parseCSV(file);
        return await checkExistingDates('zepto', brandSlug, rows, type);
    };

    const tabs = [
        { id: 'upload', label: 'Upload Data', icon: 'upload' },
        { id: 'sales', label: 'Sales Analysis', icon: 'trending-up' },
        { id: 'inventory', label: 'Inventory Analysis', icon: 'package' },
        { id: 'nuclear', label: 'Nuclear Analysis', icon: 'zap' }
    ];

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-white text-2xl font-black tracking-tight">
                        Zepto Analytics
                    </h1>
                    <p className="text-zinc-500 text-sm mt-1">
                        Sales & Inventory Intelligence for {currentBrand?.name || 'your brand'}
                    </p>
                </div>
                <div className="flex items-center gap-2 bg-white/5 rounded-2xl p-1">
                    {tabs.map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => {
                                setActiveTab(tab.id);
                                setSearchParams({ tab: tab.id });
                            }}
                            className={`
                                flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all
                                ${activeTab === tab.id
                                    ? 'bg-indigo-500 text-white'
                                    : 'text-zinc-400 hover:text-white hover:bg-white/5'
                                }
                            `}
                        >
                            <i data-feather={tab.icon} className="w-4 h-4"></i>
                            {tab.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Upload Tab */}
            {activeTab === 'upload' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <CSVUploader onUpload={handleUpload} type="sales" onCheckOverlap={handleCheckOverlap} platform="zepto" />
                    <CSVUploader onUpload={handleUpload} type="inventory" onCheckOverlap={handleCheckOverlap} platform="zepto" />

                    <div className="md:col-span-2 glass-card p-6">
                        <h3 className="text-white text-sm font-bold mb-4 flex items-center gap-2">
                            <i data-feather="info" className="w-4 h-4 text-indigo-400"></i>
                            Expected CSV Formats
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
                            <div>
                                <p className="text-indigo-400 font-bold mb-2 uppercase tracking-wider">Sales CSV</p>
                                <code className="text-zinc-400 block bg-black/30 p-3 rounded-lg overflow-x-auto">
                                    Date, SKU Number, SKU Name, SKU Category, City, Sales (Qty) - Units, MRP, Orders
                                </code>
                            </div>
                            <div>
                                <p className="text-emerald-400 font-bold mb-2 uppercase tracking-wider">Inventory CSV</p>
                                <code className="text-zinc-400 block bg-black/30 p-3 rounded-lg overflow-x-auto">
                                    City, SKU Name, SKU Code, Units
                                </code>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Sales Analysis Tab */}
            {activeTab === 'sales' && (
                loading ? (
                    <TrabenLoader message="Crunching your sales data..." />
                ) : (
                    <div className="space-y-6">
                        {/* Stats Grid */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <StatCard
                                label="Total Units Sold"
                                value={(stats.totalSales || 0).toLocaleString('en-IN')}
                                icon="shopping-cart"
                                color="indigo"
                            />
                            <StatCard
                                label="Gross Revenue (MRP)"
                                value={formatIndianCurrency(stats.totalRevenue)}
                                customSymbol="₹"
                                color="emerald"
                            />
                            <StatCard
                                label="Total SKUs"
                                value={(stats.uniqueProducts || 0).toLocaleString('en-IN')}
                                icon="package"
                                color="purple"
                            />
                            <StatCard
                                label="Cities Covered"
                                value={citySales.length}
                                icon="map-pin"
                                color="purple"
                            />
                        </div>

                        {/* Charts Row */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            {/* Daily Sales Trend */}
                            <div className="glass-card p-6">
                                <h3 className="text-white text-sm font-bold mb-4">Daily Sales Trend</h3>
                                <div className="h-[250px]">
                                    {dailyTrend.length > 0 ? (
                                        <ResponsiveContainer width="100%" height="100%">
                                            <LineChart data={dailyTrend}>
                                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                                                <XAxis
                                                    dataKey="date"
                                                    tick={{ fontSize: 10, fill: '#71717a' }}
                                                    tickFormatter={(d) => new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                                />
                                                <YAxis tick={{ fontSize: 10, fill: '#71717a' }} />
                                                <Tooltip
                                                    contentStyle={{ backgroundColor: 'rgba(0,0,0,0.9)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }}
                                                />
                                                <Line type="monotone" dataKey="qty" stroke="#6366f1" strokeWidth={3} dot={false} />
                                            </LineChart>
                                        </ResponsiveContainer>
                                    ) : (
                                        <EmptyState message="Upload sales data to see trends" />
                                    )}
                                </div>
                            </div>

                            {/* City Distribution */}
                            <div className="glass-card p-6">
                                <h3 className="text-white text-sm font-bold mb-4">Sales by City</h3>
                                <div className="h-[280px]">
                                    {citySales.length > 0 ? (
                                        <ResponsiveContainer width="100%" height="100%">
                                            <BarChart data={citySales.slice(0, 8)} layout="vertical" margin={{ left: 10, right: 30 }}>
                                                <defs>
                                                    <linearGradient id="barGradient" x1="0" y1="0" x2="1" y2="0">
                                                        <stop offset="0%" stopColor="#6366f1" />
                                                        <stop offset="100%" stopColor="#a855f7" />
                                                    </linearGradient>
                                                </defs>
                                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" horizontal={false} />
                                                <XAxis
                                                    type="number"
                                                    tick={{ fontSize: 10, fill: '#71717a' }}
                                                    axisLine={{ stroke: 'rgba(255,255,255,0.1)' }}
                                                    tickFormatter={(val) => val >= 1000 ? `${(val / 1000).toFixed(1)}K` : val}
                                                />
                                                <YAxis
                                                    dataKey="city"
                                                    type="category"
                                                    tick={{ fontSize: 11, fill: '#a1a1aa', fontWeight: 500 }}
                                                    width={90}
                                                    axisLine={false}
                                                    tickLine={false}
                                                />
                                                <Tooltip
                                                    cursor={false}
                                                    contentStyle={{
                                                        backgroundColor: 'rgba(0,0,0,0.95)',
                                                        border: '1px solid rgba(139,92,246,0.3)',
                                                        borderRadius: '12px',
                                                        padding: '12px 16px'
                                                    }}
                                                    formatter={(value) => [`${value.toLocaleString()} units`, 'Sales']}
                                                    labelStyle={{ color: '#fff', fontWeight: 'bold', marginBottom: '4px' }}
                                                />
                                                <Bar
                                                    dataKey="total_qty"
                                                    fill="url(#barGradient)"
                                                    radius={[0, 6, 6, 0]}
                                                    barSize={24}
                                                />
                                            </BarChart>
                                        </ResponsiveContainer>
                                    ) : (
                                        <EmptyState message="Upload sales data to see city breakdown" />
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Top Products - Visual Cards */}
                        <div className="glass-card p-6">
                            <div className="flex items-center justify-between mb-6">
                                <h3 className="text-white text-sm font-bold">Top Selling Products</h3>
                                <span className="text-zinc-500 text-xs">{salesSummary.length} products tracked</span>
                            </div>
                            {salesSummary.length > 0 ? (
                                <div className="space-y-3">
                                    {salesSummary.slice(0, 8).map((product, i) => {
                                        const maxQty = salesSummary[0]?.total_qty || 1;
                                        const percentage = (product.total_qty / maxQty) * 100;
                                        const rankColors = [
                                            'from-yellow-500 to-amber-600',
                                            'from-zinc-400 to-zinc-500',
                                            'from-amber-700 to-amber-800',
                                            'from-indigo-500 to-purple-600',
                                            'from-indigo-500 to-purple-600',
                                            'from-indigo-500 to-purple-600',
                                            'from-indigo-500 to-purple-600',
                                            'from-indigo-500 to-purple-600'
                                        ];

                                        return (
                                            <div
                                                key={product.item_id}
                                                className="group relative bg-white/[0.02] hover:bg-white/[0.05] rounded-2xl p-4 transition-all duration-300 border border-white/5 hover:border-white/10"
                                            >
                                                <div className="flex items-start gap-4">
                                                    {/* Rank Badge */}
                                                    <div className={`flex-shrink-0 w-10 h-10 rounded-xl bg-gradient-to-br ${rankColors[i]} flex items-center justify-center shadow-lg`}>
                                                        <span className="text-white font-black text-sm">#{i + 1}</span>
                                                    </div>

                                                    {/* Product Info */}
                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-white font-semibold text-sm leading-tight mb-1">{product.item_name}</p>
                                                        <p className="text-zinc-500 text-xs">{product.category}</p>

                                                        {/* Progress Bar */}
                                                        <div className="mt-3 h-1.5 bg-white/5 rounded-full overflow-hidden">
                                                            <div
                                                                className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full transition-all duration-500"
                                                                style={{ width: `${percentage}%` }}
                                                            />
                                                        </div>
                                                    </div>

                                                    {/* Stats */}
                                                    <div className="flex-shrink-0 text-right space-y-1">
                                                        <div className="flex items-center justify-end gap-2">
                                                            <span className="text-white font-black text-lg">{(product.total_qty || 0).toLocaleString('en-IN')}</span>
                                                            <span className="text-zinc-500 text-xs">units</span>
                                                        </div>
                                                        <p className="text-emerald-400 font-bold text-sm">{formatIndianCurrency(product.total_revenue)}</p>
                                                        <div className="flex items-center justify-end gap-1 text-zinc-500 text-xs">
                                                            <i data-feather="map-pin" className="w-3 h-3"></i>
                                                            <span>{product.city_count} cities</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            ) : (
                                <EmptyState message="Upload sales data to see top products" />
                            )}
                        </div>
                    </div>
                )
            )}

            {/* Inventory Analysis Tab */}
            {activeTab === 'inventory' && (
                loading ? (
                    <TrabenLoader message="Mapping your inventory network..." />
                ) : (
                    <div className="space-y-6">
                        {/* Inventory Stats */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <StatCard
                                label={inventorySearchQuery ? `Search Total: ${inventorySearchQuery}` : "Total Brand Inventory"}
                                value={inventorySearchQuery
                                    ? (facilityInventory || []).reduce((acc, fac) => {
                                        const matched = (fac.inventory_items || []).filter(item =>
                                            item.item_name.toLowerCase().includes(inventorySearchQuery.toLowerCase())
                                        );
                                        return acc + matched.reduce((sum, i) => sum + (i.total_inv || 0), 0);
                                    }, 0).toLocaleString('en-IN')
                                    : (facilityInventory || []).reduce((acc, fac) => acc + (fac.total_inv || 0), 0).toLocaleString('en-IN')}
                                icon="package"
                                color="indigo"
                            />
                            <StatCard
                                label="Healthy Feeder Houses"
                                value={facilityInventory.filter(f => (f.total_inv || 0) > 100).length}
                                icon="check-circle"
                                color="emerald"
                            />
                            <StatCard
                                label="Monitoring Required"
                                value={facilityInventory.filter(f => (f.total_inv || 0) <= 100).length}
                                icon="alert-circle"
                                color="amber"
                            />
                        </div>

                        {/* Inventory Cards by Feeder House */}
                        <div className="glass-card p-6">
                            <div className="flex flex-col xl:flex-row xl:items-center justify-between mb-6 gap-6">
                                <div className="flex items-center gap-4">
                                    <h3 className="text-white text-sm font-bold whitespace-nowrap">Inventory by Location</h3>
                                    <div className="h-4 w-px bg-white/10 hidden md:block"></div>
                                    <p className="text-zinc-500 text-[10px] hidden md:block">
                                        {facilityInventory.filter(fac => {
                                            const matchesFilter =
                                                facilityStatusFilter === 'all' ||
                                                (facilityStatusFilter === 'healthy' && fac.total_inv > 100) ||
                                                (facilityStatusFilter === 'monitor' && fac.total_inv <= 100);

                                            const matchesSearch =
                                                inventorySearchQuery === '' ||
                                                fac.all_products?.includes(inventorySearchQuery.toLowerCase()) ||
                                                fac.facility.toLowerCase().includes(inventorySearchQuery.toLowerCase());

                                            return matchesFilter && matchesSearch;
                                        }).length} facilities found
                                    </p>
                                </div>

                                <div className="flex flex-col md:flex-row items-center gap-4 flex-1 justify-end">
                                    {/* Search Bar */}
                                    <div className="relative w-full md:w-80">
                                        <i data-feather="search" className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500"></i>
                                        <input
                                            type="text"
                                            placeholder="Type product name to see stock..."
                                            value={inventorySearchQuery}
                                            onChange={(e) => setInventorySearchQuery(e.target.value)}
                                            className="w-full bg-white/5 border border-white/10 rounded-xl py-2.5 pl-10 pr-4 text-xs text-white focus:outline-none focus:border-indigo-500/50 focus:bg-white/[0.08] transition-all placeholder:text-zinc-600"
                                        />
                                        {inventorySearchQuery && (
                                            <button
                                                onClick={() => setInventorySearchQuery('')}
                                                className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white"
                                            >
                                                <i data-feather="x" className="w-3.5 h-3.5"></i>
                                            </button>
                                        )}
                                    </div>

                                    {/* Filter Status */}
                                    <div className="flex bg-white/5 p-1 rounded-xl border border-white/10 shrink-0">
                                        {['all', 'healthy', 'monitor'].map((status) => (
                                            <button
                                                key={status}
                                                onClick={() => setFacilityStatusFilter(status)}
                                                className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${facilityStatusFilter === status
                                                    ? 'bg-indigo-500 text-white shadow-lg'
                                                    : 'text-zinc-400 hover:text-white'
                                                    }`}
                                            >
                                                {status.toUpperCase()}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {facilityInventory.length > 0 ? (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {facilityInventory
                                        .filter(fac => {
                                            const matchesFilter =
                                                facilityStatusFilter === 'all' ||
                                                (facilityStatusFilter === 'healthy' && fac.total_inv > 100) ||
                                                (facilityStatusFilter === 'monitor' && fac.total_inv <= 100);

                                            const matchesSearch =
                                                inventorySearchQuery === '' ||
                                                fac.all_products?.includes(inventorySearchQuery.toLowerCase()) ||
                                                fac.facility.toLowerCase().includes(inventorySearchQuery.toLowerCase());

                                            return matchesFilter && matchesSearch;
                                        })
                                        .map((fac) => {
                                            const isSearching = inventorySearchQuery.length > 0;
                                            const matchedItems = isSearching
                                                ? (fac.inventory_items || []).filter(item =>
                                                    item.item_name.toLowerCase().includes(inventorySearchQuery.toLowerCase())
                                                )
                                                : [];

                                            const displayTotal = isSearching
                                                ? matchedItems.reduce((sum, item) => sum + item.total_inv, 0)
                                                : (fac.total_inv || 0);

                                            const displayBackend = isSearching
                                                ? matchedItems.reduce((sum, item) => sum + item.backend_inv, 0)
                                                : (fac.backend_inv || 0);

                                            const displayFrontend = isSearching
                                                ? matchedItems.reduce((sum, item) => sum + item.frontend_inv, 0)
                                                : (fac.frontend_inv || 0);

                                            const backendPct = displayTotal > 0 ? (displayBackend / displayTotal) * 100 : 0;
                                            const frontendPct = displayTotal > 0 ? (displayFrontend / displayTotal) * 100 : 0;

                                            return (
                                                <div
                                                    key={fac.facility}
                                                    className={`group bg-white/[0.02] hover:bg-white/[0.05] rounded-2xl p-5 transition-all duration-300 border ${isSearching && matchedItems.length > 0 ? 'border-indigo-500/30 bg-indigo-500/[0.02]' : 'border-white/5'} hover:border-white/10`}
                                                >
                                                    {/* Header */}
                                                    <div className="flex items-start justify-between mb-4">
                                                        <div className="flex-1 min-w-0 pr-4">
                                                            <p className="text-white font-semibold text-sm leading-tight mb-1">{fac.facility}</p>
                                                            <div className="flex items-center gap-2 text-zinc-500 text-xs mt-1">
                                                                <div className="flex items-center gap-1">
                                                                    <i data-feather="package" className="w-3 h-3"></i>
                                                                    <span>{isSearching ? `${matchedItems.length} matched` : `${fac.sku_count || 0} unique`} SKUs</span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                        <span className={`px-2 py-1 rounded-lg text-[10px] font-black ${displayTotal > 100 ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400'}`}>
                                                            {displayTotal > 100 ? 'HEALTHY' : 'MONITOR'}
                                                        </span>
                                                    </div>

                                                    {/* Stock Numbers */}
                                                    <div className="grid grid-cols-3 gap-3 mb-4">
                                                        <div className="text-center p-2 rounded-xl bg-white/[0.03]">
                                                            <p className={`font-black text-lg ${isSearching ? 'text-indigo-400' : 'text-white'}`}>{(displayTotal || 0).toLocaleString('en-IN')}</p>
                                                            <p className="text-zinc-500 text-[10px] uppercase tracking-wider">Total</p>
                                                        </div>
                                                        <div className="text-center p-2 rounded-xl bg-indigo-500/10">
                                                            <p className="text-indigo-400 font-bold text-sm">{(displayBackend || 0).toLocaleString('en-IN')}</p>
                                                            <p className="text-zinc-500 text-[10px] uppercase tracking-wider">Backend</p>
                                                        </div>
                                                        <div className="text-center p-2 rounded-xl bg-purple-500/10">
                                                            <p className="text-purple-400 font-bold text-sm">{(displayFrontend || 0).toLocaleString('en-IN')}</p>
                                                            <p className="text-zinc-500 text-[10px] uppercase tracking-wider">Frontend</p>
                                                        </div>
                                                    </div>

                                                    {/* Stock Distribution Bar */}
                                                    <div className="h-2 bg-white/5 rounded-full overflow-hidden flex mb-4">
                                                        <div
                                                            className="h-full bg-gradient-to-r from-indigo-500 to-indigo-400"
                                                            style={{ width: `${backendPct}%` }}
                                                        />
                                                        <div
                                                            className="h-full bg-gradient-to-r from-purple-500 to-purple-400"
                                                            style={{ width: `${frontendPct}%` }}
                                                        />
                                                    </div>

                                                    {/* Search Results or Top Products */}
                                                    <div className="mt-4 space-y-2">
                                                        <p className="text-zinc-500 text-[10px] uppercase tracking-wider mb-2">
                                                            {isSearching ? 'Matched Products' : 'Top SKUs in this Feeder'}
                                                        </p>
                                                        {(isSearching ? matchedItems : fac.top_products).map((prod, idx) => (
                                                            <div key={idx} className={`flex items-center justify-between text-xs py-1.5 border-b border-white/5 last:border-0 ${isSearching ? 'bg-white/[0.02] -mx-2 px-2 rounded-md' : ''}`}>
                                                                <span className={`${isSearching ? 'text-indigo-400 font-bold' : 'text-zinc-400'} truncate pr-4`}>{prod.item_name}</span>
                                                                <div className="flex items-center gap-3">
                                                                    {isSearching && (
                                                                        <div className="flex gap-1.5">
                                                                            <span className="text-[10px] text-zinc-600">B:{prod.backend_inv}</span>
                                                                            <span className="text-[10px] text-zinc-600">F:{prod.frontend_inv}</span>
                                                                        </div>
                                                                    )}
                                                                    <span className="text-white font-bold whitespace-nowrap">{(prod.total_inv || 0).toLocaleString('en-IN')}</span>
                                                                </div>
                                                            </div>
                                                        ))}
                                                        {isSearching && matchedItems.length === 0 && (
                                                            <p className="text-zinc-600 text-[10px] italic py-2">No matching products in this facility</p>
                                                        )}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                </div>
                            ) : (
                                <EmptyState message="Upload inventory data to see feeder house stock" />
                            )}
                        </div>
                    </div>
                )
            )}

            {/* Nuclear Analysis Tab */}
            {activeTab === 'nuclear' && (
                loading ? (
                    <TrabenLoader message="Analyzing stockout risks..." />
                ) : (
                    <div className="space-y-6">
                        {/* Nuclear KPIs */}
                        {nuclearData && (
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <StatCard
                                    label="Projected Stockouts (7d)"
                                    value={nuclearData.kpis.criticalItems}
                                    icon="alert-triangle"
                                    color="red"
                                />
                                <StatCard
                                    label="Avg Days On Hand (DOH)"
                                    value={nuclearData.kpis.avgDOH}
                                    icon="clock"
                                    color="indigo"
                                />
                            </div>
                        )}

                        {/* Nuclear Insights Table */}
                        <div className="glass-card overflow-hidden">
                            <div className="p-6 border-b border-white/5 flex items-center justify-between">
                                <div>
                                    <h3 className="text-white text-sm font-bold">Nuclear Insights</h3>
                                    <p className="text-zinc-500 text-xs mt-1">Cross-analyzing sales velocity (DRR) with warehouse positioning</p>
                                </div>
                                <div className="flex items-center gap-2 text-xs text-zinc-400">
                                    <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-500"></span> Healthy</span>
                                    <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-500"></span> Watch</span>
                                    <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-500"></span> Critical</span>
                                </div>
                            </div>

                            <div className="overflow-x-auto">
                                <table className="w-full text-left">
                                    <thead>
                                        <tr className="bg-white/[0.02] text-zinc-500 text-[10px] uppercase font-black tracking-widest border-b border-white/5">
                                            <th className="px-6 py-4 cursor-pointer hover:text-white transition-colors" onClick={() => setNuclearSort({ column: 'item_name', order: nuclearSort.column === 'item_name' && nuclearSort.order === 'asc' ? 'desc' : 'asc' })}>
                                                <div className="flex items-center gap-2">
                                                    Product Strategy
                                                    {nuclearSort.column === 'item_name' && (nuclearSort.order === 'asc' ? ' ↑' : ' ↓')}
                                                </div>
                                            </th>
                                            <th className="px-6 py-4 text-center cursor-pointer hover:text-white transition-colors" onClick={() => setNuclearSort({ column: 'drr', order: nuclearSort.column === 'drr' && nuclearSort.order === 'asc' ? 'desc' : 'asc' })}>
                                                <div className="flex items-center justify-center gap-2">
                                                    DRR (7d)
                                                    {nuclearSort.column === 'drr' && (nuclearSort.order === 'asc' ? ' ↑' : ' ↓')}
                                                </div>
                                            </th>
                                            <th className="px-6 py-4 text-center cursor-pointer hover:text-white transition-colors" onClick={() => setNuclearSort({ column: 'current_inv', order: nuclearSort.column === 'current_inv' && nuclearSort.order === 'asc' ? 'desc' : 'asc' })}>
                                                <div className="flex items-center justify-center gap-2">
                                                    Inventory
                                                    {nuclearSort.column === 'current_inv' && (nuclearSort.order === 'asc' ? ' ↑' : ' ↓')}
                                                </div>
                                            </th>
                                            <th className="px-6 py-4 text-center cursor-pointer hover:text-white transition-colors" onClick={() => setNuclearSort({ column: 'doh', order: nuclearSort.column === 'doh' && nuclearSort.order === 'asc' ? 'desc' : 'asc' })}>
                                                <div className="flex items-center justify-center gap-2">
                                                    DOH
                                                    {nuclearSort.column === 'doh' && (nuclearSort.order === 'asc' ? ' ↑' : ' ↓')}
                                                </div>
                                            </th>
                                            <th className="px-6 py-4 text-center cursor-pointer hover:text-white transition-colors" onClick={() => setNuclearSort({ column: 'forecasted_date', order: nuclearSort.column === 'forecasted_date' && nuclearSort.order === 'asc' ? 'desc' : 'asc' })}>
                                                <div className="flex items-center justify-center gap-2">
                                                    Forecasted Stockout
                                                    {nuclearSort.column === 'forecasted_date' && (nuclearSort.order === 'asc' ? ' ↑' : ' ↓')}
                                                </div>
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-white/5">
                                        {sortedNuclearItems.map((item) => (
                                            <tr key={item.item_id} className="group hover:bg-white/[0.02] transition-colors">
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className={`w-2 h-8 rounded-full ${item.status === 'Critical' ? 'bg-red-500/50' :
                                                            item.status === 'Watch' ? 'bg-amber-500/50' : 'bg-emerald-500/50'
                                                            }`} />
                                                        <div>
                                                            <p className="text-white text-sm font-bold leading-tight mb-1">{item.item_name}</p>
                                                            <p className="text-zinc-500 text-xs">{item.facility_count} facilities active</p>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 text-center">
                                                    <p className="text-white text-sm font-mono">{item.drr}</p>
                                                    <p className="text-zinc-500 text-xs">units/day</p>
                                                </td>
                                                <td className="px-6 py-4 text-center">
                                                    <div className="flex flex-col items-center">
                                                        <span className="text-white text-sm font-bold">{(item.current_inv || 0).toLocaleString('en-IN')}</span>
                                                        <div className="flex gap-1 mt-1">
                                                            <div className="w-1.5 h-1.5 rounded-full bg-indigo-500/50" title="Backend" />
                                                            <div className="w-1.5 h-1.5 rounded-full bg-purple-500/50" title="Frontend" />
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 text-center">
                                                    <div className={`inline-block px-3 py-1 rounded-full text-xs font-black ${item.status === 'Critical' ? 'bg-red-500/20 text-red-400' :
                                                        item.status === 'Watch' ? 'bg-amber-500/20 text-amber-400' : 'bg-emerald-500/20 text-emerald-400'
                                                        }`}>
                                                        {item.doh} Days
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 text-center">
                                                    <p className={`text-sm ${item.status === 'Critical' ? 'text-red-400 font-bold' : 'text-zinc-400'}`}>
                                                        {item.forecasted_date || 'N/A'}
                                                    </p>
                                                    {item.status === 'Critical' && <p className="text-[10px] text-red-500/50 uppercase">Urgent REOD</p>}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                )
            )}
        </div>
    );
}

function StatCard({ label, value, icon, color, customSymbol }) {
    const colorClasses = {
        indigo: 'bg-indigo-500/20 text-indigo-400',
        emerald: 'bg-emerald-500/20 text-emerald-400',
        purple: 'bg-purple-500/20 text-purple-400',
        red: 'bg-red-500/20 text-red-400',
        amber: 'bg-amber-500/20 text-amber-400'
    };

    return (
        <div className="glass-card p-4">
            <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl ${colorClasses[color]} flex items-center justify-center`}>
                    {customSymbol ? (
                        <span className="text-xl font-bold">{customSymbol}</span>
                    ) : (
                        <i data-feather={icon} className="w-5 h-5"></i>
                    )}
                </div>
                <div>
                    <p className="text-zinc-500 text-xs uppercase tracking-wider">{label}</p>
                    <p className="text-white text-xl font-black">{value}</p>
                </div>
            </div>
        </div>
    );
}

function RiskBadge({ level }) {
    const config = {
        high: { bg: 'bg-red-500/20', text: 'text-red-400', label: 'HIGH' },
        medium: { bg: 'bg-amber-500/20', text: 'text-amber-400', label: 'MEDIUM' },
        low: { bg: 'bg-emerald-500/20', text: 'text-emerald-400', label: 'LOW' }
    };
    const c = config[level] || config.low;

    return (
        <span className={`px-2 py-1 rounded-lg text-[10px] font-black ${c.bg} ${c.text}`}>
            {c.label}
        </span>
    );
}

function InventoryStatusBadge({ days }) {
    let config;
    if (days < 7) {
        config = { bg: 'bg-red-500/20', text: 'text-red-400', label: 'LOW STOCK' };
    } else if (days < 14) {
        config = { bg: 'bg-amber-500/20', text: 'text-amber-400', label: 'MODERATE' };
    } else {
        config = { bg: 'bg-emerald-500/20', text: 'text-emerald-400', label: 'HEALTHY' };
    }

    return (
        <span className={`px-2 py-1 rounded-lg text-[10px] font-black ${config.bg} ${config.text}`}>
            {config.label}
        </span>
    );
}

function EmptyState({ message }) {
    useEffect(() => {
        feather.replace();
    }, []);

    return (
        <div className="h-full flex flex-col items-center justify-center text-zinc-500">
            <i data-feather="inbox" className="w-8 h-8 opacity-30 mb-2"></i>
            <p className="text-xs">{message}</p>
        </div>
    );
}
