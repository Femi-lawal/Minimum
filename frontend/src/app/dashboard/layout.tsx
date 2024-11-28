'use client';

import { Suspense, useState } from 'react';
import TopNav from '@/components/TopNav';
import Sidebar from '@/components/Sidebar';
import RightSidebar from '@/components/RightSidebar';

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const [sidebarOpen, setSidebarOpen] = useState(false);

    return (
        <div className="min-h-screen bg-white text-gray-900 font-sans">
            {/* 1. Top Navigation */}
            <TopNav onToggleSidebar={() => setSidebarOpen(!sidebarOpen)} />

            {/* 2. Layout Container */}
            <div className="pt-14 flex min-h-screen">

                {/* 3. Left Sidebar (Retractable) */}
                <Sidebar isOpen={sidebarOpen} />

                {/* 4. Main Content Area */}
                <main className="flex-1 w-full lg:w-auto">
                    <div className="flex justify-center max-w-screen-xl mx-auto">

                        {/* Feed Column */}
                        <div className="w-full lg:max-w-2xl px-4 py-8 lg:px-8 border-r border-gray-100 min-h-screen">
                            {children}
                        </div>

                        {/* 5. Right Sidebar (Recommendations) */}
                        <Suspense fallback={<div className="w-80 pl-8 pt-8">Loading sidebar...</div>}>
                            <RightSidebar />
                        </Suspense>
                    </div>
                </main>
            </div>
        </div>
    );
}
