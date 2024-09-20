export default function ListsPage() {
    return (
        <div className="max-w-screen-xl mx-auto px-4 py-8 lg:px-8">
            <h1 className="text-4xl font-serif font-bold text-gray-900 mb-8">Your lists</h1>

            <div className="bg-gray-50 rounded-lg p-12 text-center border border-gray-100">
                <h3 className="text-xl font-bold mb-2">No lists yet</h3>
                <p className="text-gray-500 mb-6">You haven't created any lists. Start a list to save stories for later.</p>
                <button className="px-5 py-2 bg-green-600 text-white rounded-full text-sm font-medium hover:bg-green-700 transition-colors">
                    Start a list
                </button>
            </div>
        </div>
    );
}
