'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function SettingsPage() {
    const router = useRouter();

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
                        <span className="text-gray-500 hover:text-black cursor-pointer transition-colors">Publishing</span>
                        <span className="text-gray-500 hover:text-black cursor-pointer transition-colors">Notifications</span>
                        <span className="text-gray-500 hover:text-black cursor-pointer transition-colors">Membership</span>
                        <span className="text-gray-500 hover:text-black cursor-pointer transition-colors">Security</span>
                    </div>
                </div>

                <div className="space-y-16">
                    {/* Account Section */}
                    <section>
                        <h2 className="text-xl font-bold mb-6 text-gray-900 border-b border-gray-100 pb-2">Account Information</h2>
                        <div className="space-y-8">
                            <div className="flex md:flex-row flex-col md:items-center justify-between gap-4">
                                <div>
                                    <p className="text-sm text-gray-500 mb-1">Email address</p>
                                    <p className="font-medium text-gray-900">test@example.com</p>
                                </div>
                                <button className="text-sm text-green-700 hover:text-green-800 border border-gray-200 px-4 py-2 rounded-full hover:border-gray-400 transition-all">
                                    Edit email
                                </button>
                            </div>

                            <div className="flex md:flex-row flex-col md:items-center justify-between gap-4">
                                <div>
                                    <p className="text-sm text-gray-500 mb-1">Username</p>
                                    <p className="font-medium text-gray-900">@demo_user</p>
                                    <p className="text-xs text-gray-400 mt-1">minimum.com/@demo_user</p>
                                </div>
                                <button className="text-sm text-green-700 hover:text-green-800 border border-gray-200 px-4 py-2 rounded-full hover:border-gray-400 transition-all">
                                    Edit username
                                </button>
                            </div>

                            <div className="flex md:flex-row flex-col md:items-center justify-between gap-4">
                                <div className="flex items-center gap-4">
                                    <div className="h-12 w-12 bg-gray-200 rounded-full flex items-center justify-center font-bold text-gray-500">
                                        DU
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-500 mb-1">Profile Photo</p>
                                        <p className="text-xs text-gray-400">Recommended: Square, at least 1000px per side.</p>
                                    </div>
                                </div>
                                <button className="text-sm text-green-700 hover:text-green-800 border border-gray-200 px-4 py-2 rounded-full hover:border-gray-400 transition-all">
                                    Upload
                                </button>
                            </div>
                        </div>
                    </section>

                    {/* Notifications Section */}
                    <section>
                        <h2 className="text-xl font-bold mb-6 text-gray-900 border-b border-gray-100 pb-2">Email Notifications</h2>
                        <div className="space-y-6">
                            <div className="flex items-start justify-between">
                                <div>
                                    <p className="font-medium text-gray-900">Minimum Digest</p>
                                    <p className="text-sm text-gray-500 mt-1">The best stories on Minimum personalized for you.</p>
                                </div>
                                <div className="flex items-center gap-3">
                                    <select className="text-sm border-gray-300 rounded-md focus:ring-black focus:border-black">
                                        <option>Daily</option>
                                        <option>Weekly</option>
                                        <option>Off</option>
                                    </select>
                                </div>
                            </div>
                            <div className="flex items-start justify-between">
                                <div>
                                    <p className="font-medium text-gray-900">New followers</p>
                                    <p className="text-sm text-gray-500 mt-1">Notify me when someone follows me.</p>
                                </div>
                                <input type="checkbox" className="w-4 h-4 text-green-600 rounded focus:ring-green-600" defaultChecked />
                            </div>
                        </div>
                    </section>

                    {/* Danger Zone */}
                    <section className="pt-8 mt-12 border-t border-gray-100">
                        <h3 className="text-red-600 font-bold mb-4 text-sm uppercase tracking-wide">Danger Zone</h3>
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="font-medium text-gray-900">Deactivate account</p>
                                <p className="text-sm text-gray-500 mt-1">Deactivating will suspend your account until you sign back in.</p>
                            </div>
                            <button className="text-red-600 text-sm hover:underline">Deactivate account</button>
                        </div>
                        <div className="mt-6 flex items-center justify-between">
                            <div>
                                <p className="font-medium text-gray-900">Delete account</p>
                                <p className="text-sm text-gray-500 mt-1">Permanently delete your account and content.</p>
                            </div>
                            <button className="text-red-600 text-sm hover:underline">Delete account</button>
                        </div>
                    </section>
                </div>
            </div>
        </div>
    );
}
