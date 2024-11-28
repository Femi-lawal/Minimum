'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import { Post, getPostsByTag } from '@/services/api';
import { DashboardSkeleton } from '@/components/LoadingSkeleton';
import { PostCard } from '@/components/PostCard';
import Link from 'next/link';

import { Suspense } from 'react';

function DashboardContent() {
    const searchParams = useSearchParams();
    const searchQuery = searchParams.get('search') || '';

    const [posts, setPosts] = useState<Post[]>([]);
    const [loading, setLoading] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [selectedTag, setSelectedTag] = useState<string | null>(null);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);

    // Ref for intersection observer
    const loadMoreRef = useRef<HTMLDivElement>(null);

    // Fetch posts
    const fetchPosts = useCallback(async (pageNum: number, isInitial: boolean) => {
        if (isInitial) {
            setLoading(true);
        } else {
            setLoadingMore(true);
        }

        try {
            const result = await getPostsByTag(
                selectedTag || undefined,
                searchQuery || undefined,
                pageNum,
                10
            );

            if (isInitial) {
                setPosts(result.posts);
            } else {
                setPosts(prev => [...prev, ...result.posts]);
            }
            setHasMore(result.hasMore);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
            setLoadingMore(false);
        }
    }, [selectedTag, searchQuery]);

    // Initial load and reset on filter change
    useEffect(() => {
        setPage(1);
        setHasMore(true);
        fetchPosts(1, true);
    }, [selectedTag, searchQuery, fetchPosts]);

    // Intersection Observer for infinite scroll
    useEffect(() => {
        const observer = new IntersectionObserver(
            (entries) => {
                if (entries[0].isIntersecting && hasMore && !loading && !loadingMore) {
                    setPage(prev => {
                        const nextPage = prev + 1;
                        fetchPosts(nextPage, false);
                        return nextPage;
                    });
                }
            },
            { threshold: 0.1 }
        );

        if (loadMoreRef.current) {
            observer.observe(loadMoreRef.current);
        }

        return () => observer.disconnect();
    }, [hasMore, loading, loadingMore, fetchPosts]);

    if (loading && posts.length === 0) {
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
                    {posts.length === 0 ? (
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
                            {posts.map((post: Post) => (
                                <PostCard key={post.id} post={post} />
                            ))}
                        </div>
                    )}
                </div>

                {/* Infinite Scroll Trigger / Load More */}
                {hasMore && posts.length > 0 && (
                    <div
                        ref={loadMoreRef}
                        className="py-8 text-center"
                    >
                        {loadingMore ? (
                            <div className="flex justify-center">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black"></div>
                            </div>
                        ) : (
                            <span className="text-gray-400 text-sm">Scroll for more...</span>
                        )}
                    </div>
                )}

                {!hasMore && posts.length > 0 && (
                    <div className="py-8 text-center">
                        <span className="text-gray-400 text-sm">You've reached the end.</span>
                    </div>
                )}
            </div>
        </div>
    );
}

export default function DashboardPage() {
    return (
        <Suspense fallback={<DashboardSkeleton />}>
            <DashboardContent />
        </Suspense>
    );
}
