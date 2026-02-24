import { useState, useEffect } from 'react';
import { getAIInsights } from '../services/aiService';

export default function AIInsightCard({ platform, brandName, metrics }) {
    const [insights, setInsights] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [isExpanded, setIsExpanded] = useState(true);

    useEffect(() => {
        if (metrics && brandName) {
            fetchInsights();
        }
    }, [platform, brandName]);

    async function fetchInsights(force = false) {
        setLoading(true);
        setError(null);
        try {
            const result = await getAIInsights(platform, brandName, metrics, force);
            setInsights(result.insights || []);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }

    const iconMap = {
        'trending-up': (
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
            </svg>
        ),
        'alert-triangle': (
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
            </svg>
        ),
        'zap': (
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
            </svg>
        ),
        'bar-chart-2': (
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 3v18h18M7 16v-4m4 4V8m4 8v-6m4 6V6" />
            </svg>
        )
    };

    const typeColors = {
        growth: { bg: 'bg-emerald-500/10', border: 'border-emerald-500/20', text: 'text-emerald-400', glow: 'shadow-emerald-500/5' },
        warning: { bg: 'bg-amber-500/10', border: 'border-amber-500/20', text: 'text-amber-400', glow: 'shadow-amber-500/5' },
        opportunity: { bg: 'bg-blue-500/10', border: 'border-blue-500/20', text: 'text-blue-400', glow: 'shadow-blue-500/5' },
        trend: { bg: 'bg-purple-500/10', border: 'border-purple-500/20', text: 'text-purple-400', glow: 'shadow-purple-500/5' }
    };

    return (
        <div className="glass-card p-6 relative overflow-hidden">
            {/* Gradient top border */}
            <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500" />

            {/* Header */}
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-500/20 to-purple-500/20 flex items-center justify-center border border-white/5">
                        <svg className="w-4 h-4 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
                        </svg>
                    </div>
                    <div>
                        <h3 className="text-white text-sm font-bold tracking-tight">AI Insights</h3>
                        <p className="text-zinc-600 text-[10px] font-medium uppercase tracking-wider">Powered by Traben AI</p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => fetchInsights(true)}
                        disabled={loading}
                        className="p-1.5 rounded-lg hover:bg-white/5 text-zinc-500 hover:text-white transition-all disabled:opacity-50"
                        title="Refresh insights"
                    >
                        <svg className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182" />
                        </svg>
                    </button>
                    <button
                        onClick={() => setIsExpanded(!isExpanded)}
                        className="p-1.5 rounded-lg hover:bg-white/5 text-zinc-500 hover:text-white transition-all"
                    >
                        <svg className={`w-3.5 h-3.5 transition-transform ${isExpanded ? '' : 'rotate-180'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 15.75l7.5-7.5 7.5 7.5" />
                        </svg>
                    </button>
                </div>
            </div>

            {/* Content */}
            {isExpanded && (
                <div className="space-y-3">
                    {loading ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {[1, 2, 3, 4].map(i => (
                                <div key={i} className="rounded-xl bg-white/[0.02] border border-white/5 p-4 animate-pulse">
                                    <div className="h-3 bg-white/10 rounded w-1/2 mb-2" />
                                    <div className="h-2 bg-white/5 rounded w-full" />
                                </div>
                            ))}
                        </div>
                    ) : error ? (
                        <div className="rounded-xl bg-red-500/5 border border-red-500/10 p-4 text-center">
                            <p className="text-red-400 text-xs">{error}</p>
                            <button onClick={() => fetchInsights(true)} className="mt-2 text-[10px] text-red-400 underline">Try again</button>
                        </div>
                    ) : insights.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {insights.map((insight, i) => {
                                const colors = typeColors[insight.type] || typeColors.trend;
                                return (
                                    <div key={i} className={`rounded-xl ${colors.bg} border ${colors.border} p-4 ${colors.glow} shadow-lg transition-all hover:scale-[1.02]`}>
                                        <div className="flex items-start gap-3">
                                            <div className={`mt-0.5 ${colors.text}`}>
                                                {iconMap[insight.icon] || iconMap['bar-chart-2']}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-white text-xs font-bold tracking-tight mb-1">{insight.title}</p>
                                                <p className="text-zinc-400 text-[11px] leading-relaxed">{insight.description}</p>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <div className="text-center py-4">
                            <p className="text-zinc-600 text-xs">Upload data to generate AI insights</p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
