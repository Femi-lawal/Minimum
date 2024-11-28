'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { updateProfile } from '@/services/api';

export default function SettingsPage() {
    const router = useRouter();
    const { user, token, logout } = useAuth();
    const [name, setName] = useState('');
    const [bio, setBio] = useState('');
    const [avatarUrl, setAvatarUrl] = useState('');
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState('');

    useEffect(() => {
        if (user) {
            setName(user.name || '');
            setBio(''); // We don't have bio in context yet
            setAvatarUrl(user.avatar_url || '');
        }
    }, [user]);

    const handleSave = async () => {
        if (!token) {
            alert('You must be logged in.');
            return;
        }

        setSaving(true);
        setMessage('');

        try {
            await updateProfile({
                name: name || undefined,
                bio: bio || undefined,
                avatar_url: avatarUrl || undefined,
            });
            setMessage('Profile updated successfully!');
        } catch (err: any) {
            console.error('Error updating profile:', err);
            setMessage(err.message || 'Failed to update profile.');
        } finally {
            setSaving(false);
        }
    };

    if (!user) {
        return (
            <div className="min-h-screen bg-white flex items-center justify-center">
                <div className="text-center">
                    <h1 className="text-2xl font-serif font-bold mb-4">Please log in</h1>
                    <Link href="/login" className="text-green-600 hover:underline">
                        Go to Login
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-white">
            {/* Header */}
            <header className="border-b border-gray-100 sticky top-0 bg-white/80 backdrop-blur-sm z-10">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-16">
                        <Link href="/dashboard" className="flex items-center space-x-2">
                            <svg className="h-8 w-8" viewBox="0 0 40 40" fill="none">
                                <rect width="40" height="40" rx="4" fill="#000" />
                                <path d="M10 30V10H13L20 24L27 10H30V30H26V18L20 30L14 18V30H10Z" fill="#FFF" />
                            </svg>
                            <span className="text-2xl font-serif font-bold tracking-tight">Minimum</span>
                        </Link>
                    </div>
                </div>
            </header>

            {/* Settings Content */}
            <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
                <div className="flex items-baseline gap-6 mb-12 border-b border-gray-100 pb-6">
                    <h1 className="text-3xl md:text-4xl font-serif font-bold">Settings</h1>
                    <div className="flex gap-4 text-sm font-medium">
                        <span className="text-black border-b-2 border-black pb-6 -mb-6">Account</span>
                    </div>
                </div>

                {message && (
                    <div className={`mb-6 p-4 rounded ${message.includes('success') ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                        {message}
                    </div>
                )}

                <div className="space-y-16">
                    {/* Account Section */}
                    <section>
                        <h2 className="text-xl font-bold mb-6 text-gray-900 border-b border-gray-100 pb-2">Profile Information</h2>
                        <div className="space-y-8">
                            {/* Avatar */}
                            <div className="flex md:flex-row flex-col md:items-center justify-between gap-4">
                                <div className="flex items-center gap-4">
                                    <img
                                        src={avatarUrl || `https://ui-avatars.com/api/?name=${name || user.email}&background=random`}
                                        alt="Profile"
                                        className="h-16 w-16 rounded-full object-cover"
                                    />
                                    <div>
                                        <p className="text-sm text-gray-500 mb-1">Profile Photo</p>
                                        <p className="text-xs text-gray-400">Square image recommended.</p>
                                    </div>
                                </div>
                            </div>

                            {/* Avatar URL Input */}
                            <div>
                                <label className="block text-sm text-gray-500 mb-2">Avatar URL</label>
                                <input
                                    type="text"
                                    value={avatarUrl}
                                    onChange={(e) => setAvatarUrl(e.target.value)}
                                    placeholder="https://example.com/avatar.jpg"
                                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                                />
                            </div>

                            {/* Email (readonly) */}
                            <div>
                                <label className="block text-sm text-gray-500 mb-2">Email address</label>
                                <input
                                    type="email"
                                    value={user.email}
                                    disabled
                                    className="w-full px-4 py-2 border border-gray-200 rounded-md bg-gray-50 text-gray-500"
                                />
                            </div>

                            {/* Name */}
                            <div>
                                <label className="block text-sm text-gray-500 mb-2">Display Name</label>
                                <input
                                    type="text"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    placeholder="Your name"
                                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                                />
                            </div>

                            {/* Bio */}
                            <div>
                                <label className="block text-sm text-gray-500 mb-2">Short Bio</label>
                                <textarea
                                    value={bio}
                                    onChange={(e) => setBio(e.target.value)}
                                    placeholder="Tell us about yourself..."
                                    rows={3}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 resize-none"
                                />
                            </div>

                            {/* Save Button */}
                            <div className="flex justify-end">
                                <button
                                    onClick={handleSave}
                                    disabled={saving}
                                    className="px-6 py-2 bg-green-600 text-white rounded-full font-medium hover:bg-green-700 transition-colors disabled:opacity-50"
                                >
                                    {saving ? 'Saving...' : 'Save Changes'}
                                </button>
                            </div>
                        </div>
                    </section>

                    {/* Danger Zone */}
                    <section className="pt-8 mt-12 border-t border-gray-100">
                        <h3 className="text-red-600 font-bold mb-4 text-sm uppercase tracking-wide">Danger Zone</h3>
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="font-medium text-gray-900">Log out</p>
                                <p className="text-sm text-gray-500 mt-1">Sign out of your account.</p>
                            </div>
                            <button
                                onClick={() => {
                                    logout();
                                    router.push('/');
                                }}
                                className="text-red-600 text-sm hover:underline"
                            >
                                Log out
                            </button>
                        </div>
                    </section>
                </div>
            </div>
        </div>
    );
}
