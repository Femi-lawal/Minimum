'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { setAuthToken } from '../services/api';

interface User {
    id: string;
    email: string;
    name?: string;
    avatar_url?: string;
}

interface AuthContextType {
    user: User | null;
    token: string | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    login: (email: string, password: string) => Promise<boolean>;
    logout: () => void;
    demoLogin: () => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [token, setToken] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);



    // Load from localStorage on mount
    useEffect(() => {
        const storedToken = localStorage.getItem('token');
        const storedUser = localStorage.getItem('user');

        if (storedToken && storedUser) {
            if (isTokenExpired(storedToken)) {
                console.warn('Token expired, clearing storage');
                localStorage.removeItem('token');
                localStorage.removeItem('user');
                setAuthToken(null);
            } else {
                setAuthToken(storedToken); // Set immediately
                setToken(storedToken);
                setUser(JSON.parse(storedUser));
            }
        }
        setIsLoading(false);
    }, []);

    const isTokenExpired = (token: string): boolean => {
        try {
            const payloadBase64 = token.split('.')[1];
            if (!payloadBase64) return true;
            const decodedJson = JSON.parse(atob(payloadBase64));
            const exp = decodedJson.exp;
            if (!exp) return true;
            // Date.now() is in ms, exp is in seconds
            return (Date.now() >= exp * 1000);
        } catch (e) {
            return true;
        }
    };

    const login = async (email: string, password: string): Promise<boolean> => {
        try {
            const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8080';
            const res = await fetch(`${API_URL}/api/v1/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password }),
            });

            if (!res.ok) {
                return false;
            }

            const data = await res.json();
            const { token: newToken, user: userData } = data.data;

            // Update API header
            setAuthToken(newToken);

            // Store in state
            setToken(newToken);
            setUser(userData);

            // Persist to localStorage
            localStorage.setItem('token', newToken);
            localStorage.setItem('user', JSON.stringify(userData));

            return true;
        } catch (error) {
            console.error('Login error:', error);
            return false;
        }
    };

    const demoLogin = async (): Promise<boolean> => {
        return login('alice@example.com', 'demo123');
    };

    const logout = () => {
        setAuthToken(null);
        setToken(null);
        setUser(null);
        localStorage.removeItem('token');
        localStorage.removeItem('user');
    };

    return (
        <AuthContext.Provider value={{
            user,
            token,
            isAuthenticated: !!token,
            isLoading,
            login,
            logout,
            demoLogin,
        }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}
