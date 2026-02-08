import { useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuthStore } from '../store/authStore';

const getSocketURL = () => {
    if (typeof window === 'undefined') return 'http://localhost:5000';

    const hostname = window.location.hostname;
    const isLocal = hostname === 'localhost' || hostname === '127.0.0.1' || hostname.startsWith('192.168.');
    const isVercel = hostname.includes('vercel.app');

    if (import.meta.env.VITE_API_URL) return import.meta.env.VITE_API_URL.replace('/api', '');
    if (isVercel) return 'https://truth-or-dare-xoo4.onrender.com';
    if (isLocal) return 'http://localhost:5000';

    return 'https://truth-or-dare-xoo4.onrender.com';
};

const SOCKET_URL = getSocketURL();

export const useSocket = (roomCode: string) => {
    const [socket, setSocket] = useState<Socket | null>(null);
    const user = useAuthStore((state: any) => state.user); // Using any to bypass inference issue for now, or use AuthState if imported

    useEffect(() => {
        if (!user || !roomCode) return;

        const newSocket = io(SOCKET_URL, {
            transports: ['websocket'],
        });

        newSocket.emit('join_room', { roomCode, user });

        setSocket(newSocket);

        return () => {
            newSocket.disconnect();
        };
    }, [roomCode, user]);

    return socket;
};
