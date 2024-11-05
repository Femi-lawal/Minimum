'use client';

import { useEffect, useState } from 'react';
import { Post, getPostsByTag } from '@/services/api';
import { DashboardSkeleton } from '@/components/LoadingSkeleton';
import { PostCard } from '@/components/PostCard';
import Link from 'next/link';

export default function DashboardPage() {
    const [posts, setPosts] = useState<Post[]>([]);
    const [filteredPosts, setFilteredPosts] = useState<Post[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedTag, setSelectedTag] = useState<string | null>(null);

    useEffect(() => {
        const fetchPosts = async () => {
            setLoading(true);
            try {
                // Use API abstraction instead of hardcoded URL
                const fetchedPosts = await getPostsByTag(selectedTag || undefined);
                setPosts(fetchedPosts);
                setFilteredPosts(fetchedPosts);
            } catch (err: any) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchPosts();
    }, [selectedTag]); // Re-fetch when tag changes

    // Search filtering still on frontend for now (could move to backend too)
    useEffect(() => {
        let filtered = posts;

        if (searchQuery) {
            filtered = filtered.filter(post =>
                post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                post.content.toLowerCase().includes(searchQuery.toLowerCase())
            );
        }

        setFilteredPosts(filtered);
    }, [searchQuery, posts]);

    if (loading) {
        return (
            <div className="w-full">
                <h2 className="text-sm font-semibold tracking-wide text-gray-500 uppercase mb-6">
                    For you
                </h2>
                <DashboardSkeleton />
            </div>
        );
    }

    if (error) {
        return (
            <div className="max-w-2xl mx-auto px-4 py-16 text-center">
                <p className="text-red-600">Error loading posts: {error}</p>
            </div>
        );
    }

    return (
        <div className="w-full">
            <div className="space-y-8">
                {/* Feed Header */}
                <div className="border-b border-gray-100 pb-4 mb-8">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center space-x-6">
                            <button className="text-sm font-medium border-b-2 border-black pb-4 -mb-4">
                                For you
                            </button>
                            <button className="text-sm text-gray-500 hover:text-black font-medium border-b-2 border-transparent hover:border-black pb-4 -mb-4 transition-all">
                                Following
                            </button>
                        </div>
                    </div>
                </div>

                {/* Posts List */}
                <div>
                    {filteredPosts.length === 0 ? (
                        <div className="text-center py-20 bg-gray-50 rounded-lg">
                            <p className="text-gray-500 mb-4">
                                {searchQuery ? `No posts found for "${searchQuery}"` : 'No posts yet.'}
                            </p>
                            {!searchQuery && (
                                <Link
                                    href="/post/new"
                                    className="inline-block px-4 py-2 bg-black text-white rounded-full text-sm hover:bg-gray-800"
                                >
                                    Write your first story
                                </Link>
                            )}
                        </div>
                    ) : (
                        <div className="space-y-0 divide-y divide-gray-100">
                            {filteredPosts.map((post) => (
                                <PostCard key={post.id} post={post} />
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
