import Link from 'next/link';
import NotificationDropdown from './NotificationDropdown';
import ThemeToggle from './ThemeToggle';

interface TopNavProps {
    onToggleSidebar: () => void;
}

export default function TopNav({ onToggleSidebar }: TopNavProps) {
    return (
        <header className="fixed top-0 left-0 right-0 h-14 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 z-50 flex items-center justify-between px-4 transition-colors">
            {/* Left: Logo & Toggle */}
            <div className="flex items-center space-x-4">
                <button
                    onClick={onToggleSidebar}
                    className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full lg:hidden"
                >
                    <svg className="w-6 h-6 text-gray-600 dark:text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                    </svg>
                </button>

                <Link href="/dashboard" className="flex items-center space-x-2">
                    <svg className="h-8 w-8" viewBox="0 0 40 40" fill="none">
                        <rect width="40" height="40" rx="4" className="fill-black dark:fill-white" />
                        <path d="M10 30V10H13L20 24L27 10H30V30H26V18L20 30L14 18V30H10Z" className="fill-white dark:fill-black" />
                    </svg>
                    <span className="text-xl font-serif font-bold tracking-tight hidden sm:block dark:text-white">Minimum</span>
                </Link>
            </div>

            {/* Right: Actions */}
            <div className="flex items-center space-x-4">
                <Link href="/post/new" className="flex items-center space-x-2 text-gray-500 hover:text-black dark:text-gray-400 dark:hover:text-white">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                    <span className="text-sm hidden sm:block">Write</span>
                </Link>

                {/* Theme Toggle */}
                <ThemeToggle />

                {/* Notifications */}
                <NotificationDropdown />

                <Link href="/dashboard/profile" className="flex items-center space-x-2">
                    <div className="w-8 h-8 rounded-full bg-green-600 text-white flex items-center justify-center text-sm font-medium">
                        A
                    </div>
                </Link>
            </div>
        </header>
    );
}
