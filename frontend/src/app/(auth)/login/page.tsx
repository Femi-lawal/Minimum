'use client';

import { Suspense, useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

function LoginForm() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { login, demoLogin, isAuthenticated } = useAuth();

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    // Redirect if already authenticated
    useEffect(() => {
        if (isAuthenticated) {
            router.push('/dashboard');
        }
    }, [isAuthenticated, router]);

    // Handle demo query param
    useEffect(() => {
        const doDemo = async () => {
            if (searchParams?.get('demo') === 'true') {
                setLoading(true);
                const success = await demoLogin();
                if (success) {
                    router.push('/dashboard');
                } else {
                    setError('Demo login failed. Please try manually.');
                    setEmail('alice@example.com');
                    setPassword('demo123');
                }
                setLoading(false);
            }
        };
        doDemo();
    }, [searchParams, demoLogin, router]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        const success = await login(email, password);
        if (success) {
            router.push('/dashboard');
        } else {
            setError('Invalid email or password');
        }
        setLoading(false);
    };

    const handleDemoLogin = async () => {
        setLoading(true);
        setError('');
        const success = await demoLogin();
        if (success) {
            router.push('/dashboard');
        } else {
            setError('Demo login failed');
        }
        setLoading(false);
    };

    return (
        <div className="max-w-md w-full space-y-8">
            <div>
                <div className="flex justify-center">
                    <svg className="h-12 w-12" viewBox="0 0 40 40" fill="none">
                        <rect width="40" height="40" rx="4" fill="#000" />
                        <path d="M10 30V10H13L20 24L27 10H30V30H26V18L20 30L14 18V30H10Z" fill="#FFF" />
                    </svg>
                </div>
                <h2 className="mt-6 text-center text-3xl font-serif font-bold text-gray-900">
                    Sign in to Minimum
                </h2>
                <p className="mt-2 text-center text-sm text-gray-600">
                    Or{' '}
                    <button
                        onClick={handleDemoLogin}
                        className="font-medium text-green-600 hover:text-green-500"
                        disabled={loading}
                    >
                        try the demo account
                    </button>
                </p>
            </div>

            <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
                <div className="rounded-md shadow-sm -space-y-px">
                    <div>
                        <label htmlFor="email-address" className="sr-only">
                            Email address
                        </label>
                        <input
                            id="email-address"
                            name="email"
                            type="email"
                            autoComplete="email"
                            required
                            className="appearance-none rounded-none relative block w-full px-3 py-3 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-green-500 focus:border-green-500 focus:z-10 sm:text-sm"
                            placeholder="Email address"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                        />
                    </div>
                    <div>
                        <label htmlFor="password" className="sr-only">
                            Password
                        </label>
                        <input
                            id="password"
                            name="password"
                            type="password"
                            autoComplete="current-password"
                            required
                            className="appearance-none rounded-none relative block w-full px-3 py-3 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-green-500 focus:border-green-500 focus:z-10 sm:text-sm"
                            placeholder="Password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                        />
                    </div>
                </div>

                {error && (
                    <div className="text-red-500 text-sm text-center bg-red-50 py-2 rounded">
                        {error}
                    </div>
                )}

                <div>
                    <button
                        type="submit"
                        disabled={loading}
                        className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-full text-white bg-black hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 transition"
                    >
                        {loading ? 'Signing in...' : 'Sign in'}
                    </button>
                </div>

                <div className="flex items-center justify-center space-x-4 text-sm">
                    <Link href="/register" className="font-medium text-green-600 hover:text-green-500">
                        Sign up
                    </Link>
                    <span className="text-gray-300">|</span>
                    <Link href="/" className="font-medium text-gray-600 hover:text-gray-500">
                        Back to home
                    </Link>
                </div>
            </form>

            {/* Demo Credentials Info */}
            <div className="text-center text-xs text-gray-400 pt-4 border-t border-gray-200">
                <p>Demo credentials: alice@example.com / demo123</p>
            </div>
        </div>
    );
}

export default function LoginPage() {
    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
            <Suspense fallback={
                <div className="text-center">
                    <div className="animate-pulse text-gray-400">Loading...</div>
                </div>
            }>
                <LoginForm />
            </Suspense>
        </div>
    );
}
