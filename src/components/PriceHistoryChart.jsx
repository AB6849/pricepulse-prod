import { useState, useEffect } from 'react';
import feather from 'feather-icons';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { getProductPriceHistory } from '../services/productService';

export default function PriceHistoryChart({ productId, internalId, platform, brand, currentPrice, onClose }) {
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function loadHistory() {
            if (!productId) return;
            try {
                setLoading(true);
                const data = await getProductPriceHistory(productId, platform, brand, internalId);

                // Format and reverse data (since it's fetched DESC)
                const formattedData = (data || []).filter(item => item && item.recorded_date).map(item => {
                    const dateObj = new Date(item.recorded_date);
                    const isValidDate = dateObj instanceof Date && !isNaN(dateObj.getTime());
                    const dateStr = isValidDate
                        ? dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                        : 'Unknown';

                    return {
                        date: dateStr,
                        price: parseFloat(item.price) || 0
                    };
                }).reverse();

                setHistory(formattedData);
            } catch (err) {
                console.error('Failed to load history:', err);
            } finally {
                setLoading(false);
            }
        }
        loadHistory();
    }, [productId, internalId, platform, brand]);

    useEffect(() => {
        if (window.feather) window.feather.replace();
        feather.replace();
    }, [loading, history]);

    return (
        <div className="flex flex-col h-full w-full">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h3 className="text-sm font-bold text-white uppercase tracking-widest">Price History</h3>
                    <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider mt-0.5">Last 14 Days</p>
                </div>
                {onClose && (
                    <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-full transition-colors group">
                        <i data-feather="x" className="w-4 h-4 text-zinc-500 group-hover:text-white"></i>
                    </button>
                )}
            </div>

            <div className="w-full h-[300px] mt-4">
                {loading ? (
                    <div className="h-full w-full flex items-center justify-center">
                        <div className="w-6 h-6 border-2 border-white/10 border-t-indigo-500 rounded-full animate-spin"></div>
                    </div>
                ) : history.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={history} margin={{ top: 10, right: 10, left: 0, bottom: 20 }}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                            <XAxis
                                dataKey="date"
                                axisLine={false}
                                tickLine={false}
                                tick={{ fontSize: 9, fill: '#71717a', fontWeight: 'bold' }}
                                dy={10}
                            />
                            <YAxis
                                axisLine={false}
                                tickLine={false}
                                tick={{ fontSize: 9, fill: '#71717a', fontWeight: 'bold' }}
                                domain={['auto', 'auto']}
                                dx={-5}
                            />
                            <Tooltip
                                contentStyle={{
                                    backgroundColor: 'rgba(15, 15, 26, 0.95)',
                                    border: '1px solid rgba(255, 255, 255, 0.1)',
                                    borderRadius: '16px',
                                    backdropFilter: 'blur(20px)',
                                    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)',
                                    padding: '12px 16px',
                                }}
                                itemStyle={{ color: '#fff', fontSize: '12px', fontWeight: 'bold' }}
                                labelStyle={{ color: '#94a3b8', fontSize: '10px', marginBottom: '6px', fontWeight: 'black', textTransform: 'uppercase' }}
                                cursor={{ stroke: 'rgba(99, 102, 241, 0.2)', strokeWidth: 2 }}
                            />
                            <Line
                                type="monotone"
                                dataKey="price"
                                stroke="#6366f1"
                                strokeWidth={4}
                                dot={{ fill: '#6366f1', strokeWidth: 2, r: 4, stroke: '#0a0a14' }}
                                activeDot={{ r: 7, fill: '#818cf8', stroke: '#fff', strokeWidth: 3 }}
                                isAnimationActive={false}
                            />
                        </LineChart>
                    </ResponsiveContainer>
                ) : (
                    <div className="h-full w-full flex flex-col items-center justify-center text-zinc-600">
                        <i data-feather="box" className="w-8 h-8 mb-2 opacity-20"></i>
                        <p className="text-[10px] font-black uppercase tracking-widest">No data available yet</p>
                        <p className="text-[8px] font-bold uppercase tracking-wider mt-1 opacity-50">Tracking starts today</p>
                    </div>
                )}
            </div>
        </div>
    );
}
