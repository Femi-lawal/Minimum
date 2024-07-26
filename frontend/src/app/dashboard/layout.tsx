'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const router = useRouter();

    const handleLogout = () => {
        router.push('/login');
    };

    return (
        <div className="min-h-screen bg-white">
            {/* Medium-style header */}
            <header className="border-b border-gray-200">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-16">
                        <div className="flex items-center space-x-8">
                            {/* Logo */}
                            <Link href="/dashboard" className="flex items-center space-x-2">
                                <svg className="h-7 w-7" viewBox="0 0 40 40" fill="none">
                                    <rect width="40" height="40" rx="4" fill="#000" />
                                    <path d="M10 30V10H13L20 24L27 10H30V30H26V18L20 30L14 18V30H10Z" fill="#FFF" />
                                </svg>
                                <span className="text-2xl font-serif font-bold">Minimum</span>
                            </Link>

                            {/* Search */}
                            <div className="hidden md:block">
                                <div className="relative">
                                    <input
                                        type="text"
                                        placeholder="Search"
                                        className="w-64 py-1.5 pl-3 pr-10 text-sm bg-gray-50 rounded-full focus:outline-none focus:bg-white focus:ring-1 focus:ring-gray-300"
                                    />
                                    <svg className="absolute right-3 top-2 h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                    </svg>
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center space-x-6">
                            <Link href="/post/new" className="flex items-center space-x-2 text-sm text-gray-600 hover:text-black">
                                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                                </svg>
                                <span>Write</span>
                            </Link>

                            <Link href="/settings" className="text-gray-600 hover:text-black" title="Settings">
                                <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.310 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                </svg>
                            </Link>

                            <Link href="/dashboard/profile" className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-xs font-semibold text-gray-700 hover:bg-gray-300">
                                U
                            </Link>

                            <button
                                onClick={handleLogout}
                                className="text-sm text-gray-600 hover:text-black"
                            >
                                Sign out
                            </button>
                        </div>
                    </div>
                </div>
            </header>

            {/* Main content area */}
            <main className="max-w-7xl mx-auto">
                {children}
            </main>
        </div>
    );
}
