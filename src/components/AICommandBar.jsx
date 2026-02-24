import { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { askTraben, buildAnalyticsContext } from '../services/aiService';
import { useLocation } from 'react-router-dom';

export default function AICommandBar() {
    const [isOpen, setIsOpen] = useState(false);
    const [question, setQuestion] = useState('');
    const [messages, setMessages] = useState([]);
    const [loading, setLoading] = useState(false);
    const inputRef = useRef(null);
    const messagesEndRef = useRef(null);
    const { currentBrand } = useAuth();
    const location = useLocation();

    // Keyboard shortcut & Custom Event
    useEffect(() => {
        const handler = (e) => {
            if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
                e.preventDefault();
                setIsOpen(prev => !prev);
            }
            if (e.key === 'Escape' && isOpen) {
                setIsOpen(false);
            }
        };

        const eventHandler = () => setIsOpen(true);

        window.addEventListener('keydown', handler);
        window.addEventListener('open-ai-command-bar', eventHandler);

        return () => {
            window.removeEventListener('keydown', handler);
            window.removeEventListener('open-ai-command-bar', eventHandler);
        };
    }, [isOpen]);

    useEffect(() => {
        if (isOpen && inputRef.current) {
            setTimeout(() => inputRef.current?.focus(), 100);
        }
    }, [isOpen]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const detectPlatform = useCallback(() => {
        const path = location.pathname;
        if (path.includes('blinkit')) return 'blinkit';
        if (path.includes('swiggy') || path.includes('instamart')) return 'instamart';
        if (path.includes('zepto')) return 'zepto';
        if (path.includes('amazon')) return 'amazon';
        return 'all';
    }, [location]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!question.trim() || loading) return;

        const userQ = question.trim();
        setQuestion('');
        setMessages(prev => [...prev, { role: 'user', content: userQ }]);
        setLoading(true);

        try {
            const result = await askTraben(userQ, {
                brandName: currentBrand?.brand_name || 'Unknown',
                platform: detectPlatform(),
                pageContext: location.pathname
            });
            setMessages(prev => [...prev, { role: 'ai', content: result.answer, tokens: result.tokens }]);
        } catch (err) {
            setMessages(prev => [...prev, { role: 'ai', content: `⚠️ ${err.message}`, isError: true }]);
        } finally {
            setLoading(false);
        }
    };

    const suggestions = [
        "What's my best selling SKU this month?",
        "Which cities need restocking urgently?",
        "Give me a weekly performance summary",
        "Compare inventory health across platforms"
    ];

    return (
        <>
            {/* Floating Trigger Button */}
            <button
                onClick={() => setIsOpen(true)}
                className="fixed bottom-6 right-6 z-50 group flex items-center gap-3 px-5 py-3.5 rounded-2xl
                    bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500
                    text-white shadow-2xl shadow-indigo-500/25 hover:shadow-indigo-500/40
                    transition-all duration-300 hover:scale-105 active:scale-95"
                title="Ask Traben AI (⌘K)"
            >
                <div className="relative">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456z" />
                    </svg>
                    <div className="absolute -top-1 -right-1 w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                </div>
                <span className="text-sm font-bold tracking-tight hidden md:block">Ask Traben</span>
                <kbd className="hidden md:flex items-center gap-0.5 px-1.5 py-0.5 rounded-md bg-white/20 text-[10px] font-mono">
                    ⌘K
                </kbd>
            </button>

            {/* Modal Overlay */}
            {isOpen && (
                <div className="fixed inset-0 z-[100] flex items-end md:items-center justify-center p-4">
                    {/* Backdrop */}
                    <div
                        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                        onClick={() => setIsOpen(false)}
                    />

                    {/* Chat Panel */}
                    <div className="relative w-full max-w-2xl max-h-[85vh] flex flex-col 
                        bg-[#0a0a0f]/95 backdrop-blur-xl border border-white/10 rounded-3xl 
                        shadow-[0_40px_100px_rgba(99,102,241,0.15)] overflow-hidden
                        animate-reveal"
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between px-6 py-4 border-b border-white/5">
                            <div className="flex items-center gap-3">
                                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/20">
                                    <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
                                    </svg>
                                </div>
                                <div>
                                    <h3 className="text-white text-sm font-bold tracking-tight">Ask Traben AI</h3>
                                    <p className="text-zinc-500 text-[10px] font-medium">
                                        Analyzing {currentBrand?.brand_name || 'your brand'} • {detectPlatform() === 'all' ? 'All Platforms' : detectPlatform()}
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={() => setIsOpen(false)}
                                className="p-2 rounded-xl hover:bg-white/5 text-zinc-500 hover:text-white transition-colors"
                            >
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        {/* Messages Area */}
                        <div className="flex-1 overflow-y-auto p-6 space-y-4 min-h-[200px] max-h-[50vh] custom-scrollbar">
                            {messages.length === 0 ? (
                                <div className="text-center py-8">
                                    <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-indigo-500/20 to-purple-500/20 flex items-center justify-center border border-white/5">
                                        <svg className="w-8 h-8 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
                                        </svg>
                                    </div>
                                    <p className="text-zinc-400 text-sm font-medium mb-1">Ask me anything about your data</p>
                                    <p className="text-zinc-600 text-xs">Sales trends, inventory health, competitor insights, and more</p>

                                    <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-2">
                                        {suggestions.map((s, i) => (
                                            <button
                                                key={i}
                                                onClick={() => { setQuestion(s); inputRef.current?.focus(); }}
                                                className="text-left px-4 py-3 rounded-xl bg-white/[0.03] border border-white/5 
                                                    text-zinc-500 text-xs hover:text-white hover:bg-white/[0.06] hover:border-indigo-500/20
                                                    transition-all duration-200"
                                            >
                                                <span className="text-indigo-400/60 mr-1.5">→</span> {s}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            ) : (
                                messages.map((msg, i) => (
                                    <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                        <div className={`max-w-[85%] px-4 py-3 rounded-2xl text-sm leading-relaxed ${msg.role === 'user'
                                            ? 'bg-indigo-500/20 text-white border border-indigo-500/20'
                                            : msg.isError
                                                ? 'bg-red-500/10 text-red-400 border border-red-500/20'
                                                : 'bg-white/[0.03] text-zinc-300 border border-white/5'
                                            }`}>
                                            {msg.role === 'ai' ? (
                                                <div className="ai-response prose prose-invert prose-sm max-w-none">
                                                    <div dangerouslySetInnerHTML={{ __html: formatMarkdown(msg.content) }} />
                                                    {msg.tokens && (
                                                        <p className="text-[10px] text-zinc-600 mt-2 text-right">{msg.tokens} tokens</p>
                                                    )}
                                                </div>
                                            ) : (
                                                <p>{msg.content}</p>
                                            )}
                                        </div>
                                    </div>
                                ))
                            )}
                            {loading && (
                                <div className="flex justify-start">
                                    <div className="bg-white/[0.03] border border-white/5 rounded-2xl px-5 py-4">
                                        <div className="flex items-center gap-2">
                                            <div className="flex gap-1">
                                                <div className="w-2 h-2 rounded-full bg-indigo-500 animate-bounce" style={{ animationDelay: '0ms' }} />
                                                <div className="w-2 h-2 rounded-full bg-purple-500 animate-bounce" style={{ animationDelay: '150ms' }} />
                                                <div className="w-2 h-2 rounded-full bg-pink-500 animate-bounce" style={{ animationDelay: '300ms' }} />
                                            </div>
                                            <span className="text-zinc-500 text-xs font-medium">Analyzing...</span>
                                        </div>
                                    </div>
                                </div>
                            )}
                            <div ref={messagesEndRef} />
                        </div>

                        {/* Input Area */}
                        <form onSubmit={handleSubmit} className="p-4 border-t border-white/5">
                            <div className="flex items-center gap-3">
                                <input
                                    ref={inputRef}
                                    type="text"
                                    value={question}
                                    onChange={(e) => setQuestion(e.target.value)}
                                    placeholder="Ask about sales, inventory, forecasts..."
                                    className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white 
                                        placeholder:text-zinc-600 focus:outline-none focus:border-indigo-500/50 focus:bg-white/[0.08]
                                        transition-all"
                                    disabled={loading}
                                />
                                <button
                                    type="submit"
                                    disabled={loading || !question.trim()}
                                    className="p-3 rounded-xl bg-indigo-500 hover:bg-indigo-600 disabled:bg-white/5 disabled:text-zinc-600
                                        text-white transition-all duration-200 hover:scale-105 active:scale-95 disabled:hover:scale-100"
                                >
                                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
                                    </svg>
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </>
    );
}

// Simple markdown formatter
function formatMarkdown(text) {
    if (!text) return '';
    return text
        .replace(/### (.*)/g, '<h4 class="text-white font-bold text-sm mt-3 mb-1">$1</h4>')
        .replace(/## (.*)/g, '<h3 class="text-white font-bold text-base mt-3 mb-1">$1</h3>')
        .replace(/# (.*)/g, '<h2 class="text-white font-bold text-lg mt-3 mb-2">$1</h2>')
        .replace(/\*\*(.*?)\*\*/g, '<strong class="text-white font-bold">$1</strong>')
        .replace(/\*(.*?)\*/g, '<em>$1</em>')
        .replace(/`(.*?)`/g, '<code class="px-1.5 py-0.5 rounded bg-white/10 text-indigo-300 text-xs font-mono">$1</code>')
        .replace(/^- (.*)/gm, '<li class="ml-4 list-disc text-zinc-300 text-sm leading-relaxed">$1</li>')
        .replace(/^(\d+)\. (.*)/gm, '<li class="ml-4 list-decimal text-zinc-300 text-sm leading-relaxed">$2</li>')
        .replace(/\n\n/g, '<br/><br/>')
        .replace(/\n/g, '<br/>');
}
