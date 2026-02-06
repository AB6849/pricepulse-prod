import React from 'react';

export default function TrabenLoader({ message = "Loading analytics..." }) {
    return (
        <div className="flex-1 flex flex-col items-center justify-center py-24 min-h-[70vh] space-y-10 animate-fadeIn">
            {/* Logo Container with Glow Effect */}
            <div className="relative">
                {/* Outer Glow Ring */}
                <div className="absolute inset-0 -m-8 rounded-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 opacity-20 blur-3xl animate-pulse"></div>

                {/* Spinning Ring */}
                <div className="absolute inset-0 -m-8 flex items-center justify-center">
                    <svg className="w-48 h-48 animate-spin-slow opacity-80" viewBox="0 0 100 100">
                        <defs>
                            <linearGradient id="loader-gradient-final" x1="0%" y1="0%" x2="100%" y2="100%">
                                <stop offset="0%" stopColor="#6366f1" />
                                <stop offset="50%" stopColor="#8b5cf6" />
                                <stop offset="100%" stopColor="#ec4899" />
                            </linearGradient>
                        </defs>
                        <circle
                            cx="50"
                            cy="50"
                            r="46"
                            fill="none"
                            stroke="url(#loader-gradient-final)"
                            strokeWidth="1"
                            strokeLinecap="round"
                            strokeDasharray="90 200"
                        />
                    </svg>
                </div>

                {/* Logo */}
                <div className="relative z-10 w-32 h-32 flex items-center justify-center">
                    <img
                        src="/trabenfull.png"
                        alt="Traben Logo"
                        className="w-24 h-auto animate-float brightness-0 invert opacity-100"
                        style={{ filter: 'brightness(0) invert(1) drop-shadow(0 0 10px rgba(99, 102, 241, 0.5))' }}
                    />
                </div>
            </div>

            {/* Loading Text */}
            <div className="text-center space-y-4">
                <p
                    className="text-white font-black text-sm tracking-[0.3em]"
                    style={{ textTransform: 'uppercase' }}
                >
                    {message}
                </p>
                <div className="flex items-center justify-center gap-2">
                    <span className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                    <span className="w-2 h-2 bg-purple-500 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                    <span className="w-2 h-2 bg-pink-500 rounded-full animate-bounce"></span>
                </div>
            </div>
        </div>
    );
}
