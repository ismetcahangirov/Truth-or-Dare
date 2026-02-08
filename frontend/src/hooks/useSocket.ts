import { useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuthStore } from '../store/authStore';

const isLocal = typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');
const prodSocketURL = 'https://truth-or-dare-xoo4.onrender.com';

const SOCKET_URL = import.meta.env.VITE_API_URL?.replace('/api', '') || (isLocal ? 'http://localhost:5000' : prodSocketURL);

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
