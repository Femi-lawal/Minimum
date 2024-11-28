'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';

export default function NewPostPage() {
    const router = useRouter();
    const { token, user } = useAuth();
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [tags, setTags] = useState('');
    const [coverImage, setCoverImage] = useState('');
    const [loading, setLoading] = useState(false);

    // Auto-resize textarea
    const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        setContent(e.target.value);
        e.target.style.height = 'auto';
        e.target.style.height = e.target.scrollHeight + 'px';
    };

    const handlePublish = async () => {
        if (!title.trim() || !content.trim()) return;
        if (!token) {
            alert('You must be logged in to publish.');
            return;
        }

        setLoading(true);
        try {
            const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8080';
            const response = await fetch(`${API_URL}/api/v1/posts`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    title,
                    content,
                    tags: tags.split(',').map(t => t.trim()).filter(Boolean),
                    cover_image: coverImage
                }),
            });

            if (response.ok) {
                router.push('/dashboard');
            } else {
                const err = await response.json();
                alert(`Failed to publish: ${err.message || 'Unknown error'}`);
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
            <header className="fixed top-0 left-0 right-0 bg-white/90 backdrop-blur-md z-50 border-b border-gray-100">
                <div className="flex items-center justify-between px-4 sm:px-6 lg:px-8 py-3 max-w-5xl mx-auto">
                    <div className="flex items-center gap-4">
                        <Link href="/dashboard">
                            <span className="font-serif font-bold text-2xl tracking-tighter">M</span>
                        </Link>
                        <span className="text-sm text-gray-400 font-light">
                            Draft in {user?.name || 'Guest'}
                        </span>
                    </div>
                    <div className="flex items-center gap-4">
                        <button
                            onClick={handlePublish}
                            disabled={loading || !title || !content}
                            className={`px-4 py-1.5 text-sm font-medium bg-green-600 text-white rounded-full hover:bg-green-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed`}
                        >
                            {loading ? 'Publishing...' : 'Publish'}
                        </button>
                        <div className="h-8 w-8 rounded-full bg-gradient-to-tr from-green-400 to-blue-500 flex items-center justify-center text-white text-xs font-bold">
                            {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
                        </div>
                    </div>
                </div>
            </header>

            <main className="max-w-3xl mx-auto px-4 pt-24 pb-12">
                <div className="space-y-6">
                    {/* Cover Image Input */}
                    <input
                        type="text"
                        placeholder="Add a cover image URL (optional)"
                        value={coverImage}
                        onChange={(e) => setCoverImage(e.target.value)}
                        className="w-full text-sm text-gray-500 placeholder-gray-300 border-none outline-none bg-transparent hover:bg-gray-50 p-2 rounded transition-colors"
                    />

                    {/* Title Input */}
                    <input
                        type="text"
                        placeholder="Title"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        className="w-full text-5xl font-serif font-bold placeholder-gray-300 border-none outline-none resize-none bg-transparent tracking-tight text-gray-900"
                    />

                    {/* Tags Input */}
                    <input
                        type="text"
                        placeholder="Add tags (comma separated)..."
                        value={tags}
                        onChange={(e) => setTags(e.target.value)}
                        className="w-full text-sm text-green-600 placeholder-gray-300 border-none outline-none bg-transparent"
                    />

                    {/* Content Input */}
                    <textarea
                        placeholder="Tell your story..."
                        value={content}
                        onChange={handleContentChange}
                        className="w-full min-h-[60vh] text-xl font-serif text-gray-800 placeholder-gray-300 border-none outline-none resize-none bg-transparent leading-relaxed"
                    />
                </div>
            </main>
        </div>
    );
}
