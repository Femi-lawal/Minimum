'use client';

import { use, useEffect, useState } from 'react';
import { Post } from '@/services/api';
import { PostCard } from '@/components/PostCard';
import { DashboardSkeleton } from '@/components/LoadingSkeleton';

export default function TopicPage({ params }: { params: Promise<{ slug: string }> }) {
    // Unwrap params in Next.js 15+ (async params)
    const { slug } = use(params);

    const [posts, setPosts] = useState<Post[]>([]);
    const [loading, setLoading] = useState(true);

    // Capitalize each word (e.g., "self improvement" -> "Self Improvement")
    const topicName = slug.split(/[\s-]+/).map(word =>
        word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');

    useEffect(() => {
        const fetchTopicPosts = async () => {
            const API_URL = (typeof window === 'undefined' && process.env.API_URL)
                ? process.env.API_URL
                : (process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8080');

            try {
                // Fetch filtered by tag
                const res = await fetch(`${API_URL}/api/v1/posts?tag=${encodeURIComponent(topicName)}`);
                const data = await res.json();
                setPosts(data.data || []);
            } catch (e) {
                console.error("Failed to fetch topic posts", e);
            } finally {
                setLoading(false);
            }
        };
        fetchTopicPosts();
    }, [slug, topicName]);

    if (loading) return <DashboardSkeleton />;

    return (
        <div className="max-w-screen-xl mx-auto px-4 py-8 lg:px-8">
            <div className="mb-12 text-center">
                <span className="text-sm font-bold tracking-wider text-gray-500 uppercase mb-2 block">TOPIC</span>
                <h1 className="text-5xl font-serif font-bold text-gray-900 mb-6">{topicName}</h1>
                <div className="flex justify-center space-x-4">
                    <button className="px-5 py-2 bg-green-600 text-white rounded-full font-medium hover:bg-green-700 transition">
                        Follow
                    </button>
                    <button className="px-5 py-2 border border-gray-300 rounded-full font-medium hover:border-black transition">
                        Start writing
                    </button>
                </div>
            </div>

            <div className="max-w-2xl mx-auto">
                <div className="border-b border-gray-100 pb-4 mb-8">
                    <span className="font-bold text-sm">Recommended stories</span>
                </div>

                {posts.length === 0 ? (
                    <div className="text-center py-20 text-gray-500">
                        No stories found for {topicName}.
                    </div>
                ) : (
                    <div className="space-y-0 divide-y divide-gray-100">
                        {posts.map(post => <PostCard key={post.id} post={post} />)}
                    </div>
                )}
            </div>
        </div>
    );
}
