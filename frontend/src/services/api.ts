import axios from 'axios';
import { useAuthStore } from '../store/authStore.ts';

const getBaseURL = () => {
    if (typeof window === 'undefined') return 'http://localhost:5000/api';

    const hostname = window.location.hostname;
    const isLocal = hostname === 'localhost' || hostname === '127.0.0.1' || hostname.startsWith('192.168.');
    const isVercel = hostname.includes('vercel.app');

    if (import.meta.env.VITE_API_URL) return import.meta.env.VITE_API_URL;
    if (isVercel) return 'https://truth-or-dare-xoo4.onrender.com/api';
    if (isLocal) return 'http://localhost:5000/api';

    return 'https://truth-or-dare-xoo4.onrender.com/api'; // Default fallback
};

const api = axios.create({
    baseURL: getBaseURL(),
    headers: {
        'Content-Type': 'application/json',
    },
});

api.interceptors.request.use((config: any) => {
    const token = useAuthStore.getState().token;
    if (token && config.headers) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

api.interceptors.response.use(
    (response: any) => response,
    (error: any) => {
        if (error.response?.status === 401) {
            useAuthStore.getState().logout();
        }
        return Promise.reject(error);
    }
);

export default api;
