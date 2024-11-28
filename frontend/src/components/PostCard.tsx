import Link from 'next/link';
import { Post, toggleClap, toggleBookmark } from '@/services/api';
import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';

interface PostCardProps {
    post: Post;
}

export const PostCard = ({ post }: PostCardProps) => {
    const { token } = useAuth();
    const [clapped, setClapped] = useState(false); // Optimistic toggling not fully supported yet without auth state
    const [clapsCount, setClapsCount] = useState(post.claps_count || 0);
    const [isClapping, setIsClapping] = useState(false);

    const [bookmarked, setBookmarked] = useState(post.is_bookmarked || false);
    const [isBookmarking, setIsBookmarking] = useState(false);

    const handleClap = async (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();

        if (!token) {
            alert("Please log in to clap.");
            return;
        }

        if (isClapping) return;

        // Optimistic update
        const previousClapped = clapped;
        const previousCount = clapsCount;

        setIsClapping(true);
        // Toggle locally
        setClapped(!clapped);
        setClapsCount(prev => clapped ? prev - 1 : prev + 1);

        try {
            const result = await toggleClap(post.id);
            setClapped(result.clapped);
            setClapsCount(result.claps_count);
        } catch (err) {
            console.error("Failed to clap", err);
            // Revert
            setClapped(previousClapped);
            setClapsCount(previousCount);
        } finally {
            setIsClapping(false);
        }
    };

    const handleBookmark = async (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();

        if (!token) {
            alert("Please log in to bookmark.");
            return;
        }

        if (isBookmarking) return;

        // Optimistic update
        const previousBookmarked = bookmarked;
        setIsBookmarking(true);
        setBookmarked(!bookmarked);

        try {
            const result = await toggleBookmark(post.id);
            setBookmarked(result.bookmarked);
        } catch (err) {
            console.error("Failed to bookmark", err);
            setBookmarked(previousBookmarked);
        } finally {
            setIsBookmarking(false);
        }
    };

    // Get author data (fallback if missing)
    const authorName = post.author?.name || 'Anonymous';
    const authorAvatar = post.author?.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(authorName)}&background=random`;

    // Format date (e.g., "Dec 12, 2025")
    const formatDate = (dateString: string) => {
        if (!dateString) return '';
        const date = new Date(dateString);
        return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).format(date);
    };

    return (
        <article className="border-b border-gray-100 py-10 last:border-b-0 cursor-pointer group">
            <div className="flex justify-between items-start gap-12">
                <div className="flex-1">
                    {/* Header: Author Info */}
                    <div className="flex items-center space-x-2 mb-3">
                        <Link href={`/user/${post.author_id}`}>
                            <div className="flex items-center space-x-2 cursor-pointer">
                                <img
                                    src={authorAvatar}
                                    alt={authorName}
                                    className="w-6 h-6 rounded-full"
                                />
                                <span className="text-sm font-medium text-gray-900 hover:underline">
                                    {authorName}
                                </span>
                            </div>
                        </Link>
                        <span className="text-gray-400 text-sm">·</span>
                        <span className="text-sm text-gray-500">
                            {formatDate(post.published_at || post.created_at)}
                        </span>
                    </div>

                    {/* Content Link */}
                    <Link href={`/post/${post.id}`}>
                        <div className="mb-2">
                            <h2 className="text-xl sm:text-2xl font-bold font-serif text-gray-900 leading-tight mb-1 group-hover:underline decoration-gray-900">
                                {post.title}
                            </h2>
                            <p className="text-base text-gray-500 font-serif leading-snug line-clamp-2 sm:line-clamp-3">
                                {post.content}
                            </p>
                        </div>
                    </Link>

                    {/* Footer: Meta & Actions */}
                    <div className="flex items-center justify-between mt-6">
                        <div className="flex items-center space-x-3">
                            {post.tags && post.tags.length > 0 ? (
                                <Link href={`/dashboard/topic/${post.tags[0].toLowerCase().replace(/\s+/g, '-')}`}>
                                    <span className="px-2.5 py-1 bg-gray-100 text-xs font-medium text-gray-600 rounded-full hover:bg-gray-200 transition-colors">
                                        {post.tags[0]}
                                    </span>
                                </Link>
                            ) : (
                                <span className="px-2.5 py-1 bg-gray-100 text-xs font-medium text-gray-600 rounded-full">
                                    General
                                </span>
                            )}
                            <span className="text-xs text-gray-500">
                                {post.reading_time || 5} min read
                            </span>
                        </div>

                        <div className="flex items-center space-x-4">
                            {/* Clap Button */}
                            <button
                                onClick={handleClap}
                                className={`flex items-center space-x-1 group transition-colors ${clapped ? 'text-black' : 'text-gray-400 hover:text-black'}`}
                                title="Clap"
                            >
                                <svg className={`w-6 h-6 ${clapped ? 'fill-current' : 'fill-none'} stroke-current`} viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5" />
                                </svg>
                                <span className="text-sm font-medium">{clapsCount > 0 ? clapsCount : ''}</span>
                            </button>

                            <button
                                onClick={handleBookmark}
                                className={`transition-colors ${bookmarked ? 'text-black' : 'text-gray-400 hover:text-black'}`}
                                title={bookmarked ? "Remove Bookmark" : "Bookmark"}
                                disabled={isBookmarking}
                            >
                                <svg className={`w-6 h-6 ${bookmarked ? 'fill-current' : 'fill-none'} stroke-current`} viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                                </svg>
                            </button>
                        </div>
                    </div>
                </div>

                {/* Right: Image (Thumbnail placeholder) */}
                <div className="hidden sm:block w-32 h-32 sm:w-40 sm:h-28 bg-gray-100 rounded flex-shrink-0 relative overflow-hidden">
                    {/* Use post image or generic seeded image */}
                    <img
                        src={post.image_url || `https://picsum.photos/seed/${post.id}/320/200`}
                        alt={post.title}
                        className="absolute inset-0 w-full h-full object-cover"
                    />
                </div>
            </div>
        </article>
    );
};
