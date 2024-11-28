import { useState, useEffect, useRef, useCallback } from 'react';
import { getNotifications, markNotificationRead, Notification } from '@/services/api';
import { useAuth } from '@/contexts/AuthContext';
import { useWebSocket } from '@/hooks/useWebSocket';
import Link from 'next/link';

export default function NotificationDropdown() {
    const { token } = useAuth();
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    const fetchNotifications = useCallback(async () => {
        if (!token) return;
        try {
            const data = await getNotifications();
            setNotifications(data.notifications);
            setUnreadCount(data.unread_count);
        } catch (error) {
            console.error('Failed to load notifications', error);
        }
    }, [token]);

    // WebSocket for real-time notifications
    const handleWebSocketMessage = useCallback((data: any) => {
        if (data.type === 'notification') {
            // A new notification arrived - refresh the list
            fetchNotifications();
        }
    }, [fetchNotifications]);

    const { isConnected } = useWebSocket({
        token,
        onMessage: handleWebSocketMessage,
    });

    useEffect(() => {
        fetchNotifications();
    }, [token, fetchNotifications]);

    // Close on click outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleRead = async (notification: Notification) => {
        if (!notification.read) {
            try {
                await markNotificationRead(notification.id);
                setUnreadCount(prev => Math.max(0, prev - 1));
                setNotifications(prev => prev.map(n =>
                    n.id === notification.id ? { ...n, read: true } : n
                ));
            } catch (err) {
                console.error('Failed to mark read', err);
            }
        }
        setIsOpen(false); // Close dropdown on navigate
    };

    const getIcon = (type: string) => {
        switch (type) {
            case 'clap': return '👏';
            case 'follow': return '👤';
            case 'bookmark': return '🔖';
            case 'comment': return '💬';
            default: return '📢';
        }
    };

    const getMessage = (n: Notification) => {
        switch (n.type) {
            case 'clap': return 'clapped for';
            case 'follow': return 'followed you';
            case 'bookmark': return 'bookmarked';
            case 'comment': return 'commented on';
            default: return 'interacted with';
        }
    };

    if (!token) return null;

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="relative p-1 text-gray-500 hover:text-black transition-colors"
                aria-label="Notifications"
            >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
                {unreadCount > 0 && (
                    <span className="absolute top-0 right-0 block h-2.5 w-2.5 rounded-full ring-2 ring-white bg-green-600 transform translate-x-1/4 -translate-y-1/4"></span>
                )}
            </button>

            {isOpen && (
                <div className="absolute right-0 mt-2 w-80 bg-white rounded-md shadow-lg py-1 border border-gray-100 ring-1 ring-black ring-opacity-5 z-50">
                    <div className="px-4 py-2 border-b border-gray-100 text-sm font-semibold text-gray-700">
                        Notifications
                    </div>
                    <div className="max-h-96 overflow-y-auto">
                        {notifications.length === 0 ? (
                            <div className="px-4 py-6 text-center text-sm text-gray-500">
                                No new notifications
                            </div>
                        ) : (
                            notifications.map(n => (
                                <Link
                                    key={n.id}
                                    href={n.post_id ? `/post/${n.post_id}` : `/user/${n.actor_id}`}
                                    onClick={() => handleRead(n)}
                                    className={`block px-4 py-3 hover:bg-gray-50 transition-colors ${!n.read ? 'bg-green-50' : ''}`}
                                >
                                    <div className="flex items-start space-x-3">
                                        <div className="flex-shrink-0 text-xl">
                                            {getIcon(n.type)}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium text-gray-900 truncate">
                                                {n.actor_name}
                                            </p>
                                            <p className="text-sm text-gray-500">
                                                {getMessage(n)} {n.post_title ? <span className="font-semibold text-gray-700">"{n.post_title}"</span> : ''}
                                            </p>
                                            <p className="text-xs text-gray-400 mt-1">
                                                {new Date(n.created_at).toLocaleDateString()}
                                            </p>
                                        </div>
                                        {!n.read && (
                                            <div className="flex-shrink-0 self-center">
                                                <div className="h-2 w-2 rounded-full bg-green-600"></div>
                                            </div>
                                        )}
                                    </div>
                                </Link>
                            ))
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
