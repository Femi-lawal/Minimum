'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { getUser, getPosts, toggleFollow, User, Post } from '@/services/api';
import { useAuth } from '@/contexts/AuthContext';

export default function UserProfilePage() {
    const params = useParams();
    const { token } = useAuth();
    const [user, setUser] = useState<User | null>(null);
    const [posts, setPosts] = useState<Post[]>([]);
    const [loading, setLoading] = useState(true);
    const [isFollowing, setIsFollowing] = useState(false);
    const [isUpdatingFollow, setIsUpdatingFollow] = useState(false);

    useEffect(() => {
        const fetchUserData = async () => {
            try {
                const userId = params.id as string;
                // Fetch user from API
                const userData = await getUser(userId);
                setUser(userData);
                setIsFollowing(userData.is_following || false);

                // Fetch user's posts
                // Efficiently, we should have getPostsByAuthor endpoint, but filtering all works for MVP
                const allPosts = await getPosts();
                const userPosts = allPosts.filter((p: Post) => p.author_id === userId);
                setPosts(userPosts);
            } catch (err) {
                console.error('Error fetching user:', err);
            } finally {
                setLoading(false);
            }
        };

        if (params.id) {
            fetchUserData();
        }
    }, [params.id]);

    const handleFollow = async () => {
        if (!token) {
            alert("Please log in to follow authors.");
            return;
        }
        if (isUpdatingFollow || !user) return;

        setIsUpdatingFollow(true);
        // Optimistic toggle
        setIsFollowing(!isFollowing);

        try {
            const result = await toggleFollow(user.id);
            setIsFollowing(result.following);

            // Update follower count locally
            setUser(prev => prev ? {
                ...prev,
                followers: result.following ? prev.followers + 1 : prev.followers - 1
            } : null);

        } catch (err) {
            console.error("Failed to follow/unfollow", err);
            setIsFollowing(!isFollowing); // Revert
        } finally {
            setIsUpdatingFollow(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-white flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black"></div>
            </div>
        );
    }

    if (!user) {
        return (
            <div className="min-h-screen bg-white flex items-center justify-center">
                <div className="text-center">
                    <h1 className="text-4xl font-serif font-bold mb-4">User not found</h1>
                    <Link href="/dashboard" className="text-indigo-600 hover:text-indigo-800">
                        ← Back to feed
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-white">
            {/* Header */}
            <header className="border-b border-gray-100 sticky top-0 bg-white/80 backdrop-blur-sm z-10 transition-all">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-16">
                        <Link href="/dashboard" className="flex items-center space-x-2">
                            <svg className="h-8 w-8" viewBox="0 0 40 40" fill="none">
                                <rect width="40" height="40" rx="4" fill="#000" />
                                <path d="M10 30V10H13L20 24L27 10H30V30H26V18L20 30L14 18V30H10Z" fill="#FFF" />
                            </svg>
                            <span className="text-2xl font-serif font-bold tracking-tight">Minimum</span>
                        </Link>

                        <div className="flex items-center gap-4">
                            <Link href="/post/new" className="text-sm text-gray-500 hover:text-black transition-colors">Write</Link>
                            <div className="w-8 h-8 rounded-full bg-green-600 text-white flex items-center justify-center text-xs">
                                {user.name && user.name[0]}
                            </div>
                        </div>
                    </div>
                </div>
            </header>

            {/* Profile Section */}
            <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                <div className="flex flex-col md:flex-row items-start gap-12 mb-16 border-b border-gray-100 pb-12">
                    {/* Info */}
                    <div className="flex-1 order-2 md:order-1">
                        <h1 className="text-4xl md:text-5xl font-serif font-bold mb-4 text-gray-900 tracking-tight">{user.name}</h1>
                        <p className="text-lg text-gray-500 mb-8 leading-relaxed font-serif">{user.bio || "No bio yet."}</p>

                        <div className="flex items-center gap-6 text-sm text-gray-500 mb-8 border-t border-b border-gray-100 py-4">
                            <span className="hover:text-black cursor-pointer transition-colors"><strong className="text-black font-medium">{user.followers}</strong> Followers</span>
                            <span className="hover:text-black cursor-pointer transition-colors"><strong className="text-black font-medium">{user.following}</strong> Following</span>
                        </div>

                        <div className="flex items-center gap-4">
                            <button
                                onClick={handleFollow}
                                className={`px-5 py-2 rounded-full text-sm font-medium transition-all ${isFollowing
                                    ? 'border border-gray-300 text-gray-700 hover:border-black hover:text-black'
                                    : 'bg-green-600 text-white hover:bg-green-700'
                                    }`}
                            >
                                {isFollowing ? 'Following' : 'Follow'}
                            </button>

                            <button className="p-2 rounded-full border border-gray-300 text-gray-500 hover:border-black hover:text-black transition-all">
                                <svg width="19" height="19" viewBox="0 0 24 24" fill="none"><path d="M20 4h-2a2 2 0 0 0-2-2h-8a2 2 0 0 0-2 2H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2zm-5 7h-6m6 0v6m0-6H9m6 0v-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
                            </button>
                        </div>
                    </div>

                    {/* Avatar */}
                    <div className="order-1 md:order-2">
                        <img
                            src={user.avatar_url || `https://ui-avatars.com/api/?name=${user.name}&background=random`}
                            alt={user.name}
                            className="w-32 h-32 md:w-40 md:h-40 rounded-full object-cover ring-4 ring-gray-50"
                        />
                    </div>
                </div>

                {/* User's Posts */}
                <div className="max-w-2xl">
                    <h2 className="text-sm font-bold uppercase tracking-wider text-black border-b border-black inline-block pb-4 mb-8">
                        Latest
                    </h2>

                    {posts.length === 0 ? (
                        <div className="py-12 text-gray-500 italic font-serif">
                            {user.name} hasn't published any stories yet.
                        </div>
                    ) : (
                        <div className="space-y-10">
                            {posts.map((post) => (
                                <Link key={post.id} href={`/post/${post.id}`} className="group block">
                                    <article className="border-b border-gray-100 pb-10">
                                        <div className="flex items-center gap-2 mb-3">
                                            <div className="flex items-center gap-2 text-sm">
                                                <span className="font-medium text-gray-900">{user.name}</span>
                                                <span className="text-gray-400">·</span>
                                                <span className="text-gray-500">{new Date(post.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</span>
                                            </div>
                                        </div>

                                        <h3 className="text-xl md:text-2xl font-bold mb-2 group-hover:underline decoration-2 underline-offset-4 decoration-black">{post.title}</h3>
                                        <p className="text-gray-600 font-serif leading-relaxed mb-4 line-clamp-2 md:line-clamp-3">
                                            {post.content}
                                        </p>

                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-4 text-xs text-gray-500">
                                                <span className="bg-gray-100 px-2 py-1 rounded-full">Article</span>
                                                <span>5 min read</span>
                                            </div>
                                            <svg className="w-5 h-5 text-gray-400 group-hover:text-black transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h.01M12 12h.01M19 12h.01M6 12a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0z" /></svg>
                                        </div>
                                    </article>
                                </Link>
                            ))}
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}
