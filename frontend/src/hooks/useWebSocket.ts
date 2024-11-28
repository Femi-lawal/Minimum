'use client';

import { useEffect, useRef, useCallback, useState } from 'react';

interface WebSocketHookOptions {
    token: string | null;
    onMessage?: (data: any) => void;
    onConnect?: () => void;
    onDisconnect?: () => void;
}

interface WebSocketHookReturn {
    isConnected: boolean;
    lastMessage: any | null;
}

export function useWebSocket({
    token,
    onMessage,
    onConnect,
    onDisconnect,
}: WebSocketHookOptions): WebSocketHookReturn {
    const wsRef = useRef<WebSocket | null>(null);
    const [isConnected, setIsConnected] = useState(false);
    const [lastMessage, setLastMessage] = useState<any | null>(null);
    const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    const connect = useCallback(() => {
        if (!token) return;

        // Use the Gateway URL for WebSocket
        const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const wsHost = process.env.NEXT_PUBLIC_WS_URL || 'localhost:8080';
        const wsUrl = `${wsProtocol}//${wsHost}/ws?token=${token}`;

        try {
            const ws = new WebSocket(wsUrl);

            ws.onopen = () => {
                console.log('WebSocket connected');
                setIsConnected(true);
                onConnect?.();
            };

            ws.onmessage = (event) => {
                try {
                    const data = JSON.parse(event.data);
                    setLastMessage(data);
                    onMessage?.(data);
                } catch (e) {
                    console.error('Failed to parse WebSocket message:', e);
                }
            };

            ws.onclose = () => {
                console.log('WebSocket disconnected');
                setIsConnected(false);
                onDisconnect?.();

                // Attempt to reconnect after 5 seconds
                reconnectTimeoutRef.current = setTimeout(() => {
                    if (token) {
                        connect();
                    }
                }, 5000);
            };

            ws.onerror = (error) => {
                console.error('WebSocket error:', error);
            };

            wsRef.current = ws;
        } catch (error) {
            console.error('Failed to create WebSocket:', error);
        }
    }, [token, onMessage, onConnect, onDisconnect]);

    useEffect(() => {
        if (token) {
            connect();
        }

        return () => {
            if (wsRef.current) {
                wsRef.current.close();
            }
            if (reconnectTimeoutRef.current) {
                clearTimeout(reconnectTimeoutRef.current);
            }
        };
    }, [token, connect]);

    return { isConnected, lastMessage };
}
