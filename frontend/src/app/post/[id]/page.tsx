'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ReadingProgress } from '@/components/ReadingProgress';
import { ClapButton } from '@/components/ClapButton';
import { ShareButton } from '@/components/ShareButton';
import { CommentSection } from '@/components/CommentSection';
import { useAuth } from '@/contexts/AuthContext';
import { getPost as fetchPostAPI, deletePost, Post } from '@/services/api';

export default function PostPage() {
    const params = useParams();
    const router = useRouter();
    const { user, token } = useAuth();
    const [post, setPost] = useState<Post | null>(null);
    const [loading, setLoading] = useState(true);
    const [isDeleting, setIsDeleting] = useState(false);

    const isAuthor = user && post && user.id === post.author_id;

    useEffect(() => {
        const fetchPost = async () => {
            try {
                const postId = params.id as string;
                const fetchedPost = await fetchPostAPI(postId);
                setPost(fetchedPost);
            } catch (err) {
                console.error('Error fetching post:', err);
            } finally {
                setLoading(false);
            }
        };

        if (params.id) fetchPost();
    }, [params.id]);

    const handleDelete = async () => {
        if (!confirm('Are you sure you want to delete this post? This action cannot be undone.')) return;
        if (!post) return;

        setIsDeleting(true);
        try {
            await deletePost(post.id);
            router.push('/dashboard');
        } catch (err: any) {
            console.error('Error deleting post:', err);
            alert(err.message || 'Failed to delete post.');
        } finally {
            setIsDeleting(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-white">
                <div className="max-w-3xl mx-auto px-4 py-20">
                    <div className="animate-pulse space-y-8">
                        <div className="h-12 bg-gray-200 rounded w-3/4"></div>
                        <div className="h-6 bg-gray-200 rounded w-1/4"></div>
                        <div className="space-y-3">
                            {[...Array(10)].map((_, i) => (
                                <div key={i} className="h-4 bg-gray-200 rounded"></div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    if (!post) {
        return (
            <div className="min-h-screen bg-white flex items-center justify-center">
                <div className="text-center">
                    <h1 className="text-4xl font-serif font-bold mb-4">Post not found</h1>
                    <Link href="/dashboard" className="text-indigo-600 hover:text-indigo-800">
                        ← Back to feed
                    </Link>
                </div>
            </div>
        );
    }

    const formatDate = (dateString: string) => {
        const options: Intl.DateTimeFormatOptions = {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        };
        return new Date(dateString).toLocaleDateString('en-US', options);
    };

    return (
        <div className="min-h-screen bg-white">
            <ReadingProgress />

            {/* Header */}
            <header className="border-b border-gray-200 sticky top-0 bg-white z-40">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-16">
                        <Link href="/dashboard" className="flex items-center space-x-2">
                            <svg className="h-7 w-7" viewBox="0 0 40 40" fill="none">
                                <rect width="40" height="40" rx="4" fill="#000" />
                                <path d="M10 30V10H13L20 24L27 10H30V30H26V18L20 30L14 18V30H10Z" fill="#FFF" />
                            </svg>
                            <span className="text-2xl font-serif font-bold">Minimum</span>
                        </Link>
                    </div>
                </div>
            </header>

            {/* Article */}
            <article className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                {/* Title */}
                <h1 className="text-5xl font-serif font-bold text-gray-900 mb-6 leading-tight">
                    {post.title}
                </h1>

                {/* Author info */}
                <div className="flex items-center gap-4 mb-8 pb-8 border-b border-gray-200">
                    <Link href={`/user/${post.author_id}`}>
                        <img
                            src={post.author?.avatar_url || `https://ui-avatars.com/api/?name=${post.author?.name || 'Author'}&background=random`}
                            alt={post.author?.name || 'Author'}
                            className="w-12 h-12 rounded-full object-cover"
                        />
                    </Link>
                    <div className="flex-1">
                        <Link href={`/user/${post.author_id}`} className="font-medium text-gray-900 hover:underline">
                            {post.author?.name || 'Anonymous'}
                        </Link>
                        <div className="text-sm text-gray-500">
                            {formatDate(post.created_at)} · 5 min read
                        </div>
                    </div>
                    <button className="px-4 py-2 border border-gray-900 rounded-full text-sm font-medium hover:bg-gray-900 hover:text-white transition-colors">
                        Follow
                    </button>
                </div>

                {/* Actions Bar */}
                <div className="flex items-center justify-between mb-12 pb-6 border-b border-gray-200">
                    <div className="flex items-center gap-6">
                        <ClapButton postId={post.id} initialClaps={post.claps_count || 0} />
                        <button className="flex items-center gap-2 text-gray-600 hover:text-gray-900">
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                            </svg>
                        </button>
                    </div>
                    <div className="flex items-center gap-4">
                        {isAuthor && (
                            <>
                                <Link
                                    href={`/post/${post.id}/edit`}
                                    className="px-3 py-1.5 text-sm text-gray-600 hover:text-gray-900 border border-gray-300 rounded-full hover:border-gray-500 transition-colors"
                                >
                                    Edit
                                </Link>
                                <button
                                    onClick={handleDelete}
                                    disabled={isDeleting}
                                    className="px-3 py-1.5 text-sm text-red-600 hover:text-red-700 border border-red-300 rounded-full hover:border-red-500 transition-colors disabled:opacity-50"
                                >
                                    {isDeleting ? 'Deleting...' : 'Delete'}
                                </button>
                            </>
                        )}
                        <button className="text-gray-600 hover:text-gray-900">
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                            </svg>
                        </button>
                        <ShareButton postId={post.id} title={post.title} />
                    </div>
                </div>

                {/* Content */}
                <div className="prose prose-lg max-w-none">
                    <p className="text-xl leading-relaxed text-gray-800 mb-6">
                        {post.content}
                    </p>

                    {/* Placeholder for more content */}
                    <p className="leading-relaxed text-gray-700">
                        This is a comprehensive article exploring the topic in depth with real-world examples
                        and practical insights. In modern software development, understanding core concepts
                        and applying best practices is crucial for building maintainable and scalable applications.
                    </p>

                    <h2 className="text-3xl font-serif font-bold mt-10 mb-4">Key Takeaways</h2>
                    <ul className="space-y-2 mb-8">
                        <li>Focus on writing clean, maintainable code</li>
                        <li>Implement proper error handling and logging</li>
                        <li>Write comprehensive tests for critical functionality</li>
                        <li>Document your code and architecture decisions</li>
                    </ul>

                    <p className="leading-relaxed text-gray-700 mb-6">
                        By following these principles and continuously learning from the community,
                        you can significantly improve your development workflow and deliver better results.
                    </p>
                </div>

                {/* Bottom actions */}
                <div className="flex items-center gap-4 mt-12 pt-8 border-t border-gray-200">
                    <ClapButton postId={post.id} initialClaps={post.claps_count || 0} />
                    <ShareButton postId={post.id} title={post.title} />
                </div>

                {/* Author Card */}
                <div className="mt-12 p-6 bg-gray-50 rounded-lg">
                    <div className="flex items-start gap-4">
                        <Link href={`/user/${post.author_id}`}>
                            <img
                                src={post.author?.avatar_url || `https://ui-avatars.com/api/?name=${post.author?.name || 'Author'}&background=random`}
                                alt={post.author?.name || 'Author'}
                                className="w-16 h-16 rounded-full object-cover"
                            />
                        </Link>
                        <div className="flex-1">
                            <Link href={`/user/${post.author_id}`}>
                                <h3 className="font-bold text-lg mb-2 hover:underline">
                                    {post.author?.name || 'Anonymous'}
                                </h3>
                            </Link>
                            <p className="text-gray-600 mb-4">
                                Writer and thinker. Follow for more stories.
                            </p>
                            <button className="px-4 py-2 bg-black text-white rounded-full text-sm font-medium hover:bg-gray-800 transition-colors">
                                Follow
                            </button>
                        </div>
                    </div>
                </div>

                {/* Comments Section */}
                <CommentSection postId={post.id} postAuthorId={post.author_id} />
            </article>
        </div>
    );
}
