import axios from 'axios';
import { useAuthStore } from '../store/authStore.ts';

const isLocal = typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');
const prodURL = 'https://truth-or-dare-xoo4.onrender.com/api';

const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL || (isLocal ? 'http://localhost:5000/api' : prodURL),
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
