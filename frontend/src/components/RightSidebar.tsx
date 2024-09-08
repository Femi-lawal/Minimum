import Link from 'next/link';

export default function RightSidebar() {
    const topics = [
        'Programming', 'Technology', 'Design',
        'Productivity', 'Writing', 'Self Improvement'
    ];

    return (
        <aside className="hidden lg:block w-80 pl-8 pt-8">
            <div className="sticky top-20">

                {/* Search */}
                <div className="relative mb-10">
                    <input
                        type="text"
                        placeholder="Search"
                        className="w-full py-2 pl-10 pr-4 bg-gray-50 border border-transparent rounded-full text-sm focus:border-gray-200 focus:bg-white focus:ring-0 transition-colors"
                    />
                    <svg className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                </div>

                {/* Recommended Topics */}
                <div className="mb-10">
                    <h4 className="font-bold text-sm text-black mb-4">Recommended topics</h4>
                    <div className="flex flex-wrap gap-2">
                        {topics.map(topic => (
                            <Link
                                key={topic}
                                href={`/dashboard/topic/${topic.toLowerCase().replace(/ /g, '-')}`}
                                className="px-3 py-2 bg-gray-100 text-sm text-gray-700 rounded-full hover:bg-gray-200 transition-colors"
                            >
                                {topic}
                            </Link>
                        ))}
                    </div>
                </div>

                {/* Footer */}
                <div className="flex flex-wrap gap-x-4 gap-y-2 text-xs text-gray-500">
                    <Link href="#" className="hover:underline">Help</Link>
                    <Link href="#" className="hover:underline">Status</Link>
                    <Link href="#" className="hover:underline">Writers</Link>
                    <Link href="#" className="hover:underline">Blog</Link>
                    <Link href="#" className="hover:underline">Careers</Link>
                    <Link href="#" className="hover:underline">Privacy</Link>
                    <Link href="#" className="hover:underline">Terms</Link>
                    <Link href="#" className="hover:underline">About</Link>
                </div>
            </div>
        </aside>
    );
}
