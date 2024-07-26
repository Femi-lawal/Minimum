'use client';

import { useEffect, useState } from 'react';
import { Post } from '@/services/api';
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
                // Pass tag if selected, otherwise fetch all
                const url = selectedTag
                    ? `http://127.0.0.1:8080/api/v1/posts?tag=${encodeURIComponent(selectedTag)}`
                    : 'http://127.0.0.1:8080/api/v1/posts';

                const response = await fetch(url);
                const data = await response.json();

                const fetchedPosts = data.data || [];
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
            <div className="grid grid-cols-12 gap-8 px-4 sm:px-6 lg:px-8 py-8">
                <div className="col-span-12 lg:col-span-8">
                    <h2 className="text-sm font-semibold tracking-wide text-gray-500 uppercase mb-6">
                        For you
                    </h2>
                    <DashboardSkeleton />
                </div>
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

    const tags = ['Programming', 'Technology', 'Design', 'Productivity', 'Writing', 'Self Improvement'];

    return (
        <div className="grid grid-cols-12 gap-8 px-4 sm:px-6 lg:px-8 py-8">
            {/* Main content */}
            <div className="col-span-12 lg:col-span-8">
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

            {/* Sidebar */}
            <aside className="hidden lg:block col-span-4">
                <div className="sticky top-20 space-y-8">
                    {/* Recommended topics */}
                    <div>
                        <h3 className="text-sm font-semibold text-gray-900 mb-4">
                            Recommended topics
                        </h3>
                        <div className="flex flex-wrap gap-2">
                            {tags.map((topic) => (
                                <button
                                    key={topic}
                                    onClick={() => setSelectedTag(selectedTag === topic ? null : topic)}
                                    className={`px-4 py-2 rounded-full text-sm transition-colors ${selectedTag === topic
                                        ? 'bg-black text-white'
                                        : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                                        }`}
                                >
                                    {topic}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Who to follow */}
                    <div>
                        <h3 className="text-sm font-semibold text-gray-900 mb-4">
                            Who to follow
                        </h3>
                        <div className="space-y-4">
                            {['Alice Chen', 'Bob Martinez', 'Charlie Kim'].map((name, i) => (
                                <div key={name} className="flex items-center justify-between">
                                    <div className="flex items-center space-x-3">
                                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-xs font-semibold text-white">
                                            {name[0]}
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium text-gray-900">{name}</p>
                                            <p className="text-xs text-gray-500">{100 - i * 10}K followers</p>
                                        </div>
                                    </div>
                                    <button className="px-3 py-1 border border-gray-300 rounded-full text-xs font-medium hover:border-black transition-colors">
                                        Follow
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Footer links */}
                    <div className="pt-4 border-t border-gray-200">
                        <div className="flex flex-wrap gap-x-4 gap-y-2 text-xs text-gray-500">
                            <Link href="/help" className="hover:text-black">Help</Link>
                            <Link href="/about" className="hover:text-black">About</Link>
                            <Link href="/terms" className="hover:text-black">Terms</Link>
                            <Link href="/privacy" className="hover:text-black">Privacy</Link>
                        </div>
                    </div>
                </div>
            </aside>
        </div>
    );
}
