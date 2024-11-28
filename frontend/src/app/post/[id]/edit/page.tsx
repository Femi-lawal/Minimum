'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { getPost, updatePost, Post } from '@/services/api';

export default function EditPostPage() {
    const router = useRouter();
    const params = useParams();
    const postId = params.id as string;
    const { token, user } = useAuth();

    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [tags, setTags] = useState('');
    const [coverImage, setCoverImage] = useState('');
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [post, setPost] = useState<Post | null>(null);

    useEffect(() => {
        const loadPost = async () => {
            try {
                const fetchedPost = await getPost(postId);
                setPost(fetchedPost);
                setTitle(fetchedPost.title);
                setContent(fetchedPost.content || '');
                setTags(fetchedPost.tags?.join(', ') || '');
                setCoverImage(fetchedPost.cover_image || '');
            } catch (err) {
                console.error('Failed to load post:', err);
                alert('Post not found or you do not have permission to edit it.');
                router.push('/dashboard');
            } finally {
                setLoading(false);
            }
        };

        if (postId) loadPost();
    }, [postId, router]);

    // Check ownership
    useEffect(() => {
        if (post && user && post.author_id !== user.id) {
            alert('You can only edit your own posts.');
            router.push(`/post/${postId}`);
        }
    }, [post, user, postId, router]);

    const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        setContent(e.target.value);
        e.target.style.height = 'auto';
        e.target.style.height = e.target.scrollHeight + 'px';
    };

    const handleUpdate = async () => {
        if (!title.trim() || !content.trim()) return;
        if (!token) {
            alert('You must be logged in to update.');
            return;
        }

        setSaving(true);
        try {
            await updatePost(
                postId,
                title,
                content,
                tags.split(',').map(t => t.trim()).filter(Boolean),
                coverImage
            );
            router.push(`/post/${postId}`);
        } catch (error: any) {
            console.error('Error updating:', error);
            alert(error.message || 'An error occurred.');
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-white flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-white">
            <header className="fixed top-0 left-0 right-0 bg-white/90 backdrop-blur-md z-50 border-b border-gray-100">
                <div className="flex items-center justify-between px-4 sm:px-6 lg:px-8 py-3 max-w-5xl mx-auto">
                    <div className="flex items-center gap-4">
                        <Link href="/dashboard">
                            <span className="font-serif font-bold text-2xl tracking-tighter">M</span>
                        </Link>
                        <span className="text-sm text-gray-400 font-light">
                            Editing
                        </span>
                    </div>
                    <div className="flex items-center gap-4">
                        <Link href={`/post/${postId}`} className="text-sm text-gray-500 hover:text-gray-700">
                            Cancel
                        </Link>
                        <button
                            onClick={handleUpdate}
                            disabled={saving || !title || !content}
                            className="px-4 py-1.5 text-sm font-medium bg-green-600 text-white rounded-full hover:bg-green-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {saving ? 'Saving...' : 'Save Changes'}
                        </button>
                    </div>
                </div>
            </header>

            <main className="max-w-3xl mx-auto px-4 pt-24 pb-12">
                <div className="space-y-6">
                    {/* Cover Image Input */}
                    <input
                        type="text"
                        placeholder="Add a cover image URL (optional)"
                        value={coverImage}
                        onChange={(e) => setCoverImage(e.target.value)}
                        className="w-full text-sm text-gray-500 placeholder-gray-300 border-none outline-none bg-transparent hover:bg-gray-50 p-2 rounded transition-colors"
                    />

                    {/* Title Input */}
                    <input
                        type="text"
                        placeholder="Title"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        className="w-full text-4xl md:text-5xl font-serif font-bold placeholder-gray-200 border-none outline-none focus:ring-0 leading-tight"
                    />

                    {/* Tags Input */}
                    <input
                        type="text"
                        placeholder="Add tags separated by commas (e.g., technology, programming)"
                        value={tags}
                        onChange={(e) => setTags(e.target.value)}
                        className="w-full text-sm text-gray-500 placeholder-gray-300 border-none outline-none bg-transparent hover:bg-gray-50 p-2 rounded transition-colors"
                    />

                    {/* Content Textarea */}
                    <textarea
                        placeholder="Tell your story..."
                        value={content}
                        onChange={handleContentChange}
                        className="w-full text-xl font-serif leading-relaxed placeholder-gray-300 border-none outline-none resize-none min-h-[400px] focus:ring-0"
                    />
                </div>
            </main>
        </div>
    );
}
