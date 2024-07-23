'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function NewPostPage() {
    const router = useRouter();
    const [title, setTitle] = useState('');
    const [content, setContent] = useState(''); // Would ideally use a rich text editor
    const [loading, setLoading] = useState(false);

    const handlePublish = async () => {
        if (!title.trim() || !content.trim()) return;

        setLoading(true);
        try {
            const response = await fetch('http://localhost:8080/api/v1/posts', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    // 'Authorization': `Bearer ${token}` // TODO: From context
                },
                body: JSON.stringify({ title, content }),
            });

            if (response.ok) {
                router.push('/dashboard');
            } else {
                alert('Failed to publish. Please try again.');
            }
        } catch (error) {
            console.error('Error publishing:', error);
            alert('An error occurred.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-white">
            <header className="flex items-center justify-between px-4 sm:px-6 lg:px-8 py-4 max-w-5xl mx-auto">
                <div className="flex items-center gap-4">
                    <Link href="/dashboard">
                        <svg className="h-8 w-8 cursor-pointer" viewBox="0 0 40 40" fill="none">
                            <rect width="40" height="40" rx="4" fill="#000" />
                            <path d="M10 30V10H13L20 24L27 10H30V30H26V18L20 30L14 18V30H10Z" fill="#FFF" />
                        </svg>
                    </Link>
                    <span className="text-sm text-gray-500">Draft in {title || 'Untitled'}</span>
                </div>
                <div className="flex items-center gap-4">
                    <button
                        onClick={handlePublish}
                        disabled={loading || !title || !content}
                        className={`px-3 py-1 text-sm bg-green-600 text-white rounded-full hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed`}
                    >
                        {loading ? 'Publishing...' : 'Publish'}
                    </button>
                    <div className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center text-xs">
                        {/* Placeholder for user avatar */}
                        U
                    </div>
                </div>
            </header>

            <main className="max-w-3xl mx-auto px-4 py-12">
                <div className="space-y-4">
                    <input
                        type="text"
                        placeholder="Title"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        className="w-full text-4xl sm:text-5xl font-serif font-bold placeholder-gray-300 border-none outline-none resize-none bg-transparent"
                    />
                    
                    <textarea 
                        placeholder="Tell your story..."
                        value={content}
                        onChange={(e) => {
                            setContent(e.target.value);
                            e.target.style.height = 'auto';
                            e.target.style.height = e.target.scrollHeight + 'px';
                        }}
                        className="w-full min-h-[50vh] text-xl text-gray-700 serif placeholder-gray-300 border-none outline-none resize-none bg-transparent leading-relaxed"
                    />
                </div>
            </main>
        </div>
    );
}
