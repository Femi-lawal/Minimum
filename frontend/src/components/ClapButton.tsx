'use client';

import { useState } from 'react';

interface ClapButtonProps {
    postId: string;
    initialClaps?: number;
    onClap?: (count: number) => void;
}

export const ClapButton = ({ postId, initialClaps = 0, onClap }: ClapButtonProps) => {
    const [claps, setClaps] = useState(initialClaps);
    const [userClaps, setUserClaps] = useState(0);
    const [isAnimating, setIsAnimating] = useState(false);
    const [showPopup, setShowPopup] = useState(false);

    const MAX_CLAPS = 50;

    const handleClap = () => {
        if (userClaps >= MAX_CLAPS) return;

        const newUserClaps = userClaps + 1;
        const newTotalClaps = claps + 1;

        setUserClaps(newUserClaps);
        setClaps(newTotalClaps);
        setIsAnimating(true);
        setShowPopup(true);

        // Trigger animation
        setTimeout(() => setIsAnimating(false), 300);
        setTimeout(() => setShowPopup(false), 800);

        // Call parent callback
        onClap?.(newTotalClaps);
    };

    return (
        <div className="relative inline-flex items-center gap-2">
            <button
                onClick={handleClap}
                disabled={userClaps >= MAX_CLAPS}
                className={`group flex items-center gap-2 px-3 py-1.5 rounded-full border transition-all
          ${userClaps > 0 ? 'border-green-500 bg-green-50' : 'border-gray-300 hover:border-gray-400'}
          ${userClaps >= MAX_CLAPS ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
          ${isAnimating ? 'scale-110' : 'scale-100'}
        `}
            >
                {/* Clap Icon */}
                <svg
                    className={`w-5 h-5 transition-colors ${userClaps > 0 ? 'text-green-600' : 'text-gray-600 group-hover:text-gray-800'}`}
                    fill={userClaps > 0 ? 'currentColor' : 'none'}
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                >
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1.5}
                        d="M7 11.5V14m0-2.5v-6a1.5 1.5 0 113 0m-3 6a1.5 1.5 0 00-3 0v2a7.5 7.5 0 0015 0v-5a1.5 1.5 0 00-3 0m-6-3V11m0-5.5v-1a1.5 1.5 0 013 0v1m0 0V11m0-5.5a1.5 1.5 0 013 0v3m0 0V11"
                    />
                </svg>

                {/* Count */}
                <span className={`text-sm font-medium ${userClaps > 0 ? 'text-green-700' : 'text-gray-700'}`}>
                    {claps > 0 ? claps : ''}
                </span>
            </button>

            {/* +1 Popup Animation */}
            {showPopup && (
                <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 animate-ping-once">
                    <span className="text-green-600 font-bold text-lg">+1</span>
                </div>
            )}

            {/* User clap count (visible when user has clapped) */}
            {userClaps > 0 && (
                <span className="text-xs text-gray-500">
                    You: {userClaps}
                </span>
            )}
        </div>
    );
};
