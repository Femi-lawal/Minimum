export default function StatsPage() {
    return (
        <div className="max-w-screen-xl mx-auto px-4 py-8 lg:px-8">
            <h1 className="text-4xl font-serif font-bold text-gray-900 mb-8">Stats</h1>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
                <div className="p-6 border border-gray-200 rounded-lg">
                    <div className="text-gray-500 text-sm font-medium uppercase mb-1">Views (30 days)</div>
                    <div className="text-3xl font-bold">1,234</div>
                </div>
                <div className="p-6 border border-gray-200 rounded-lg">
                    <div className="text-gray-500 text-sm font-medium uppercase mb-1">Reads (30 days)</div>
                    <div className="text-3xl font-bold">856</div>
                </div>
                <div className="p-6 border border-gray-200 rounded-lg">
                    <div className="text-gray-500 text-sm font-medium uppercase mb-1">Followers</div>
                    <div className="text-3xl font-bold">42</div>
                </div>
            </div>

            <h3 className="text-xl font-bold mb-6 border-b pb-4">Story Stats</h3>
            <p className="text-gray-500 italic">No stories published yet for detailed breakdown.</p>
        </div>
    );
}
