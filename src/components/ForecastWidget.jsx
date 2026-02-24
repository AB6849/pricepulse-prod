import { useState } from 'react';
import { getDemandForecast } from '../services/aiService';

export default function ForecastWidget({ brandName, platform, nuclearItems }) {
    const [forecasts, setForecasts] = useState([]);
    const [summary, setSummary] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [hasGenerated, setHasGenerated] = useState(false);

    async function generateForecast(force = false) {
        if (!nuclearItems || nuclearItems.length === 0) return;
        setLoading(true);
        setError(null);
        try {
            const result = await getDemandForecast(brandName, platform, nuclearItems, force);
            setForecasts(result.forecasts || []);
            setSummary(result.summary || '');
            setHasGenerated(true);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }

    const riskColors = {
        critical: { bg: 'bg-red-500/10', border: 'border-red-500/20', text: 'text-red-400', dot: 'bg-red-500' },
        watch: { bg: 'bg-amber-500/10', border: 'border-amber-500/20', text: 'text-amber-400', dot: 'bg-amber-500' },
        healthy: { bg: 'bg-emerald-500/10', border: 'border-emerald-500/20', text: 'text-emerald-400', dot: 'bg-emerald-500' }
    };

    const confidenceIcons = {
        high: '🎯',
        medium: '📊',
        low: '🔮'
    };

    if (!nuclearItems || nuclearItems.length === 0) return null;

    return (
        <div className="glass-card p-6 relative overflow-hidden">
            {/* Gradient top border */}
            <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-cyan-500 via-indigo-500 to-purple-500" />

            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-cyan-500/20 to-indigo-500/20 flex items-center justify-center border border-white/5">
                        <svg className="w-5 h-5 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
                        </svg>
                    </div>
                    <div>
                        <h3 className="text-white text-sm font-bold tracking-tight">AI Demand Forecast</h3>
                        <p className="text-zinc-600 text-[10px] font-medium uppercase tracking-wider">7-Day Prediction Engine</p>
                    </div>
                </div>
                <button
                    onClick={() => generateForecast(!hasGenerated ? false : true)}
                    disabled={loading}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all duration-300
                        ${hasGenerated
                            ? 'bg-white/5 border border-white/10 text-zinc-400 hover:text-white hover:bg-white/10'
                            : 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg shadow-indigo-500/20 hover:shadow-indigo-500/40 hover:scale-105 active:scale-95'
                        } disabled:opacity-50 disabled:hover:scale-100`}
                >
                    {loading ? (
                        <>
                            <svg className="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182" />
                            </svg>
                            Forecasting...
                        </>
                    ) : hasGenerated ? (
                        <>
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182" />
                            </svg>
                            Regenerate
                        </>
                    ) : (
                        <>
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
                            </svg>
                            Generate Forecast
                        </>
                    )}
                </button>
            </div>

            {/* Content */}
            {error && (
                <div className="rounded-xl bg-red-500/5 border border-red-500/10 p-4 mb-4">
                    <p className="text-red-400 text-xs">{error}</p>
                </div>
            )}

            {!hasGenerated && !loading && (
                <div className="text-center py-10 border border-dashed border-white/10 rounded-2xl bg-white/[0.01]">
                    <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-cyan-500/10 to-indigo-500/10 flex items-center justify-center border border-white/5">
                        <svg className="w-7 h-7 text-indigo-400/50" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
                        </svg>
                    </div>
                    <p className="text-zinc-400 text-sm font-medium mb-1">7-Day Demand Forecast</p>
                    <p className="text-zinc-600 text-xs max-w-sm mx-auto">
                        AI analyzes your DRR, inventory levels, and sales velocity to predict demand and recommend reorder quantities
                    </p>
                </div>
            )}

            {loading && (
                <div className="space-y-3">
                    {[1, 2, 3, 4].map(i => (
                        <div key={i} className="rounded-xl bg-white/[0.02] border border-white/5 p-4 animate-pulse flex items-center gap-4">
                            <div className="w-2 h-10 rounded-full bg-white/10" />
                            <div className="flex-1">
                                <div className="h-3 bg-white/10 rounded w-1/3 mb-2" />
                                <div className="h-2 bg-white/5 rounded w-2/3" />
                            </div>
                            <div className="h-8 w-20 bg-white/5 rounded-lg" />
                        </div>
                    ))}
                </div>
            )}

            {hasGenerated && !loading && (
                <>
                    {/* Summary */}
                    {summary && (
                        <div className="rounded-xl bg-gradient-to-r from-indigo-500/5 to-purple-500/5 border border-indigo-500/10 p-4 mb-4">
                            <p className="text-zinc-300 text-xs leading-relaxed">
                                <span className="text-indigo-400 font-bold mr-1">📊 Outlook:</span>
                                {summary}
                            </p>
                        </div>
                    )}

                    {/* Forecast Table */}
                    {forecasts.length > 0 ? (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead>
                                    <tr className="text-[9px] text-zinc-500 uppercase tracking-[0.15em] font-black border-b border-white/5">
                                        <th className="py-3 pr-4">SKU</th>
                                        <th className="py-3 px-3 text-center">7d Demand</th>
                                        <th className="py-3 px-3 text-center">Reorder Qty</th>
                                        <th className="py-3 px-3 text-center">Confidence</th>
                                        <th className="py-3 px-3 text-center">Risk</th>
                                        <th className="py-3 pl-3">Reasoning</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/5">
                                    {forecasts.map((f, i) => {
                                        const colors = riskColors[f.risk] || riskColors.healthy;
                                        return (
                                            <tr key={i} className="group hover:bg-white/[0.02] transition-colors">
                                                <td className="py-3 pr-4">
                                                    <div className="flex items-center gap-2">
                                                        <div className={`w-1.5 h-8 rounded-full ${colors.dot}`} />
                                                        <span className="text-white text-xs font-bold truncate max-w-[180px]">{f.name}</span>
                                                    </div>
                                                </td>
                                                <td className="py-3 px-3 text-center">
                                                    <span className="text-white text-sm font-mono font-bold">
                                                        {(f.predicted_demand_7d || 0).toLocaleString('en-IN')}
                                                    </span>
                                                </td>
                                                <td className="py-3 px-3 text-center">
                                                    <span className={`inline-block px-3 py-1 rounded-lg text-xs font-bold ${f.reorder_qty > 0
                                                            ? 'bg-indigo-500/20 text-indigo-300'
                                                            : 'bg-white/5 text-zinc-500'
                                                        }`}>
                                                        {f.reorder_qty > 0 ? `+${(f.reorder_qty).toLocaleString('en-IN')}` : '—'}
                                                    </span>
                                                </td>
                                                <td className="py-3 px-3 text-center">
                                                    <span className="text-sm">{confidenceIcons[f.confidence] || '📊'}</span>
                                                    <span className="text-[10px] text-zinc-500 ml-1 capitalize">{f.confidence}</span>
                                                </td>
                                                <td className="py-3 px-3 text-center">
                                                    <span className={`inline-block px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${colors.bg} ${colors.border} border ${colors.text}`}>
                                                        {f.risk}
                                                    </span>
                                                </td>
                                                <td className="py-3 pl-3">
                                                    <span className="text-zinc-500 text-[11px] leading-relaxed">{f.reason}</span>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <p className="text-zinc-600 text-xs text-center py-4">No forecasts generated</p>
                    )}
                </>
            )}
        </div>
    );
}
