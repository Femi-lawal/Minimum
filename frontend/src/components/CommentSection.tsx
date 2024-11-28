'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Comment, getComments, createComment, deleteComment } from '@/services/api';

interface CommentSectionProps {
    postId: string;
    postAuthorId: string;
}

export const CommentSection = ({ postId, postAuthorId }: CommentSectionProps) => {
    const { user, token } = useAuth();
    const [comments, setComments] = useState<Comment[]>([]);
    const [content, setContent] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        loadComments();
    }, [postId]);

    const loadComments = async () => {
        try {
            const data = await getComments(postId);
            setComments(data.comments || []);
        } catch (err) {
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!content.trim() || !token) return;

        setIsSubmitting(true);
        try {
            const newComment = await createComment(postId, content);
            setComments([...comments, newComment]); // Simple append, or prepend?
            setContent('');
        } catch (err) {
            console.error(err);
            alert("Failed to post comment");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = async (commentId: string) => {
        if (!confirm("Delete this comment?")) return;
        try {
            await deleteComment(postId, commentId);
            setComments(comments.filter(c => c.id !== commentId));
        } catch (err) {
            console.error(err);
            alert("Failed to delete comment");
        }
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }).format(date);
    };

    if (isLoading) return <div className="py-4 text-gray-500">Loading comments...</div>;

    return (
        <div className="pt-10 mt-10 border-t border-gray-100 max-w-2xl mx-auto">
            <h3 className="text-xl font-bold font-serif mb-6">Responses ({comments.length})</h3>

            {/* Input */}
            {token ? (
                <form onSubmit={handleSubmit} className="mb-10 p-6 bg-gray-50 rounded-lg shadow-sm">
                    <div className="flex gap-4">
                        <img
                            src={user?.avatar_url || `https://ui-avatars.com/api/?name=${user?.name || 'User'}`}
                            alt="User"
                            className="w-8 h-8 rounded-full"
                        />
                        <div className="flex-1">
                            <textarea
                                value={content}
                                onChange={(e) => setContent(e.target.value)}
                                placeholder="What are your thoughts?"
                                className="w-full bg-white border border-gray-200 rounded-md p-3 text-sm focus:outline-none focus:ring-1 focus:ring-gray-300 resize-none h-24 font-serif"
                            />
                            <div className="flex justify-end mt-2">
                                <button
                                    type="submit"
                                    disabled={!content.trim() || isSubmitting}
                                    className="px-4 py-2 bg-green-600 text-white rounded-full text-sm font-medium hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                >
                                    {isSubmitting ? 'Posting...' : 'Respond'}
                                </button>
                            </div>
                        </div>
                    </div>
                </form>
            ) : (
                <div className="mb-10 p-6 bg-gray-50 rounded text-center">
                    <p className="text-gray-600 text-sm">
                        <a href="/login" className="text-green-600 hover:underline">Sign in</a> to leave a comment.
                    </p>
                </div>
            )}

            {/* List */}
            <div className="space-y-8">
                {comments.map(comment => (
                    <div key={comment.id} className="border-b border-gray-100 pb-6 last:border-b-0">
                        <div className="flex justify-between items-start mb-2">
                            <div className="flex items-center space-x-3">
                                <img
                                    src={comment.author?.avatar_url || `https://ui-avatars.com/api/?name=${comment.author?.name}`}
                                    alt={comment.author?.name}
                                    className="w-10 h-10 rounded-full"
                                />
                                <div>
                                    <div className="text-sm font-medium text-gray-900">{comment.author?.name}</div>
                                    <div className="text-xs text-gray-500">{formatDate(comment.created_at)}</div>
                                </div>
                            </div>

                            {/* Delete Button (If Author of Comment or Post) */}
                            {user && (user.id === comment.user_id || user.id === postAuthorId) && (
                                <button
                                    onClick={() => handleDelete(comment.id)}
                                    className="text-gray-400 hover:text-red-600 transition-colors p-1"
                                    title="Delete comment"
                                    aria-label="Delete comment"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
                                    </svg>
                                </button>
                            )}
                        </div>
                        <div className="pl-12">
                            <p className="text-gray-800 font-serif leading-relaxed text-sm whitespace-pre-wrap">{comment.content}</p>
                        </div>
                    </div>
                ))}
                {comments.length === 0 && !isLoading && (
                    <p className="text-center text-gray-500 italic">No responses yet. Be the first to respond.</p>
                )}
            </div>
        </div>
    );
};
