import Link from 'next/link';
import { Post } from '@/services/api';

interface PostCardProps {
    post: Post;
}

export const PostCard = ({ post }: PostCardProps) => {
    // Get author initial
    const authorInitial = post.author_id?.substring(0, 1).toUpperCase() || 'A';

    // Format date
    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffTime = Math.abs(now.getTime() - date.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays === 0) return 'Today';
        if (diffDays === 1) return 'Yesterday';
        if (diffDays < 7) return `${diffDays} days ago`;
        if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
        if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`;
        return `${Math.floor(diffDays / 365)} years ago`;
    };

    return (
        <Link href={`/post/${post.id}`}>
            <article className="group cursor-pointer">
                <div className="flex items-start space-x-4">
                    {/* Author avatar */}
                    <div className="flex-shrink-0">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-sm font-semibold text-white">
                            {authorInitial}
                        </div>
                    </div>

                    <div className="flex-1 min-w-0">
                        {/* Author name and date */}
                        <div className="flex items-center space-x-2 mb-2">
                            <Link
                                href={`/user/${post.author_id}`}
                                className="text-sm font-medium text-gray-900 hover:underline"
                                onClick={(e) => e.stopPropagation()}
                            >
                                {post.author_id === '00000000-0000-0000-0000-000000000001' ? 'Alice Chen' :
                                    post.author_id === '00000000-0000-0000-0000-000000000002' ? 'Bob Martinez' :
                                        post.author_id === '00000000-0000-0000-0000-000000000005' ? 'Sarah Johnson' :
                                            `Author ${post.author_id.substring(30)}`}
                            </Link>
                            <span className="text-sm text-gray-500">
                                {formatDate(post.created_at)}
                            </span>
                        </div>

                        {/* Title  */}
                        <h3 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-gray-600 transition-colors">
                            {post.title}
                        </h3>

                        {/* Excerpt */}
                        <p className="text-base text-gray-600 mb-4 line-clamp-2">
                            {post.content}
                        </p>

                        {/* Meta info */}
                        <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-4 text-xs text-gray-500">
                                <span className="px-2 py-1 bg-gray-100 rounded-full hover:bg-gray-200 transition-colors">
                                    Programming
                                </span>
                                <span>5 min read</span>
                                <span className="flex items-center gap-1">
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                    </svg>
                                    {Math.floor(Math.random() * 1000) + 100}
                                </span>
                            </div>

                            {/* Action buttons */}
                            <div className="flex items-center space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button className="text-gray-400 hover:text-gray-600 p-1">
                                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                                    </svg>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </article>
        </Link>
    );
};
