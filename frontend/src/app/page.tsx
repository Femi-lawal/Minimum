import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-2">
              <svg className="h-8 w-8" viewBox="0 0 40 40" fill="none">
                <rect width="40" height="40" rx="4" fill="#000" />
                <path d="M10 30V10H13L20 24L27 10H30V30H26V18L20 30L14 18V30H10Z" fill="#FFF" />
              </svg>
              <h1 className="text-3xl font-serif font-bold">Minimum</h1>
            </div>
            <div className="flex items-center space-x-4">
              <Link href="/login" className="text-sm text-gray-700 hover:text-black">
                Sign in
              </Link>
              <Link
                href="/login?demo=true"
                className="px-4 py-2 bg-black text-white rounded-full text-sm font-medium hover:bg-gray-800 transition"
              >
                Get started
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
          <h2 className="text-6xl sm:text-7xl font-serif font-bold text-gray-900 mb-6">
            Human<br />stories & ideas
          </h2>
          <p className="text-xl text-gray-600 mb-12 max-w-2xl mx-auto">
            A place to read, write, and deepen your understanding of the topics that matter most to you.
          </p>
          <Link
            href="/login?demo=true"
            className="inline-block px-12 py-3 bg-black text-white rounded-full text-lg font-medium hover:bg-gray-800 transition"
          >
            Start reading
          </Link>
        </div>

        {/* Featured Content Preview */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="border-t border-gray-200 pt-16">
            <h3 className="text-sm font-semibold tracking-wide text-gray-500 uppercase mb-8">
              Trending on Minimum
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {/* Preview Cards */}
              <div className="flex space-x-4">
                <div className="text-4xl font-bold text-gray-300">01</div>
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-2">
                    <div className="w-5 h-5 rounded-full bg-gray-300"></div>
                    <span className="text-xs font-medium">Alice Chen</span>
                  </div>
                  <h4 className="font-bold text-base mb-1 hover:text-gray-600 cursor-pointer">
                    Building Scalable Microservices with Go
                  </h4>
                  <p className="text-xs text-gray-500">8 min read</p>
                </div>
              </div>

              <div className="flex space-x-4">
                <div className="text-4xl font-bold text-gray-300">02</div>
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-2">
                    <div className="w-5 h-5 rounded-full bg-gray-300"></div>
                    <span className="text-xs font-medium">Bob Martinez</span>
                  </div>
                  <h4 className="font-bold text-base mb-1 hover:text-gray-600 cursor-pointer">
                    React Performance Optimization
                  </h4>
                  <p className="text-xs text-gray-500">5 min read</p>
                </div>
              </div>

              <div className="flex space-x-4">
                <div className="text-4xl font-bold text-gray-300">03</div>
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-2">
                    <div className="w-5 h-5 rounded-full bg-gray-300"></div>
                    <span className="text-xs font-medium">Sarah Johnson</span>
                  </div>
                  <h4 className="font-bold text-base mb-1 hover:text-gray-600 cursor-pointer">
                    My Journey Learning Kubernetes
                  </h4>
                  <p className="text-xs text-gray-500">6 min read</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer CTA */}
        <div className="bg-gray-50 border-t border-gray-200">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
            <h3 className="text-4xl font-serif font-bold text-gray-900 mb-4">
              Discover stories, thinking, and expertise from writers on any topic.
            </h3>
            <Link
              href="/login"
              className="inline-block px-12 py-3 bg-black text-white rounded-full text-lg font-medium hover:bg-gray-800 transition mt-8"
            >
              Start reading
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
