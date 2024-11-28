'use client';

import { use, useEffect, useState } from 'react';
import { Post } from '@/services/api';
import { PostCard } from '@/components/PostCard';
import { DashboardSkeleton } from '@/components/LoadingSkeleton';

export default function DashboardTopicPage({ params }: { params: Promise<{ slug: string }> }) {
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
            const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8080';

            try {
                // Fetch filtered by tag
                const res = await fetch(`${API_URL}/api/v1/posts?tag=${encodeURIComponent(topicName)}`);
                if (res.ok) {
                    const data = await res.json();
                    setPosts(data.data || []);
                } else {
                    console.error("Failed to fetch topic posts: ", res.status);
                    setPosts([]);
                }
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
        <div className="max-w-4xl mx-auto px-4 py-8">
            <div className="mb-12 border-b border-gray-100 pb-8">
                <span className="text-sm font-bold tracking-wider text-green-600 uppercase mb-2 block">TOPIC</span>
                <div className="flex items-center justify-between">
                    <h1 className="text-4xl font-serif font-bold text-gray-900">{topicName}</h1>
                    <div className="flex space-x-3">
                        <button className="px-4 py-2 bg-green-600 text-white rounded-full text-sm font-medium hover:bg-green-700 transition">
                            Follow
                        </button>
                    </div>
                </div>
            </div>

            <div className="max-w-3xl">
                <h2 className="font-bold text-lg mb-6">Recommended stories</h2>

                {posts.length === 0 ? (
                    <div className="text-center py-20 bg-gray-50 rounded-lg">
                        <p className="text-gray-500 mb-4">No stories found for {topicName}.</p>
                        <button className="text-green-600 font-medium hover:underline">
                            Be the first to write about it
                        </button>
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
