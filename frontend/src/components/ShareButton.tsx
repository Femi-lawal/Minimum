'use client';

import { useState } from 'react';

interface ShareButtonProps {
    postId: string;
    title: string;
    url?: string;
}

export const ShareButton = ({ postId, title, url }: ShareButtonProps) => {
    const [showMenu, setShowMenu] = useState(false);
    const [showToast, setShowToast] = useState(false);

    const shareUrl = url || `${window.location.origin}/post/${postId}`;

    const handleCopyLink = async () => {
        try {
            await navigator.clipboard.writeText(shareUrl);
            setShowToast(true);
            setShowMenu(false);
            setTimeout(() => setShowToast(false), 2000);
        } catch (err) {
            console.error('Failed to copy:', err);
        }
    };

    const handleTwitterShare = () => {
        const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(title)}&url=${encodeURIComponent(shareUrl)}`;
        window.open(twitterUrl, '_blank', 'width=550,height=420');
        setShowMenu(false);
    };

    const handleLinkedInShare = () => {
        const linkedInUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`;
        window.open(linkedInUrl, '_blank', 'width=550,height=420');
        setShowMenu(false);
    };

    return (
        <div className="relative">
            <button
                onClick={() => setShowMenu(!showMenu)}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                aria-label="Share"
            >
                <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                </svg>
            </button>

            {/* Dropdown Menu */}
            {showMenu && (
                <>
                    <div className="fixed inset-0 z-10" onClick={() => setShowMenu(false)} />
                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-20">
                        <button
                            onClick={handleTwitterShare}
                            className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-3"
                        >
                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M23 3a10.9 10.9 0 01-3.14 1.53 4.48 4.48 0 00-7.86 3v1A10.66 10.66 0 013 4s-4 9 5 13a11.64 11.64 0 01-7 2c9 5 20 0 20-11.5a4.5 4.5 0 00-.08-.83A7.72 7.72 0 0023 3z" />
                            </svg>
                            Twitter
                        </button>
                        <button
                            onClick={handleLinkedInShare}
                            className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-3"
                        >
                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M16 8a6 6 0 016 6v7h-4v-7a2 2 0 00-2-2 2 2 0 00-2 2v7h-4v-7a6 6 0 016-6zM2 9h4v12H2z" />
                                <circle cx="4" cy="4" r="2" />
                            </svg>
                            LinkedIn
                        </button>
                        <button
                            onClick={handleCopyLink}
                            className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-3"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                            </svg>
                            Copy link
                        </button>
                    </div>
                </>
            )}

            {/* Toast Notification */}
            {showToast && (
                <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 bg-gray-900 text-white px-4 py-2 rounded-lg shadow-lg z-50">
                    Link copied to clipboard!
                </div>
            )}
        </div>
    );
};
