'use client';

import { useEffect, useState } from 'react';
import { Post } from '@/services/api';
import { PostCard } from '@/components/PostCard';
import { DashboardSkeleton } from '@/components/LoadingSkeleton';
import Link from 'next/link';

export default function StoriesPage() {
    const [posts, setPosts] = useState<Post[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Fetch posts for "Alice Chen" (UUID ending in ...001)
        const fetchMyStories = async () => {
            const API_URL = (typeof window === 'undefined' && process.env.API_URL)
                ? process.env.API_URL
                : (process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8080');

            try {
                const res = await fetch(`${API_URL}/api/v1/posts`);
                const data = await res.json();
                if (data.data) {
                    // Filter for our mock logged-in user
                    const myPosts = data.data.filter((p: Post) => p.author_id === '00000000-0000-0000-0000-000000000001');
                    setPosts(myPosts);
                }
            } catch (e) {
                console.error("Failed to fetch stories", e);
            } finally {
                setLoading(false);
            }
        };
        fetchMyStories();
    }, []);

    if (loading) return <DashboardSkeleton />;

    return (
        <div className="max-w-screen-xl mx-auto px-4 py-8 lg:px-8">
            <div className="flex justify-between items-center mb-8">
                <h1 className="text-4xl font-serif font-bold text-gray-900">Your stories</h1>
                <Link href="/post/new" className="px-4 py-2 bg-green-600 text-white rounded-full text-sm font-medium hover:bg-green-700">
                    Write a story
                </Link>
            </div>

            <div className="flex border-b border-gray-200 mb-8">
                <button className="mr-8 pb-4 border-b-2 border-black font-medium text-sm">Drafts</button>
                <button className="mr-8 pb-4 border-b-2 border-transparent text-gray-500 hover:text-black transition-colors font-medium text-sm">Published</button>
                <button className="pb-4 border-b-2 border-transparent text-gray-500 hover:text-black transition-colors font-medium text-sm">Responses</button>
            </div>

            {posts.length === 0 ? (
                <div className="text-center py-20">
                    <p className="text-gray-500">You haven't published any stories yet.</p>
                </div>
            ) : (
                <div className="space-y-0 divide-y divide-gray-100 max-w-2xl">
                    {posts.map(post => <PostCard key={post.id} post={post} />)}
                </div>
            )}
        </div>
    );
}
