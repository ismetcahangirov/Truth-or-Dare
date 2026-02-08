import { create } from 'zustand';
import { persist } from 'zustand/middleware';


interface User {
    id: string;
    username: string;
    email: string;
    avatar?: string;
}

interface AuthState {
    user: User | null;
    token: string | null;
    isAuthenticated: boolean;
    loading: boolean;
    login: (userData: User, token: string) => void;
    logout: () => void;
    setLoading: (loading: boolean) => void;
}

export const useAuthStore = create<AuthState>()(
    persist(
        (set) => ({
            user: null,
            token: null,
            isAuthenticated: false,
            loading: false,
            login: (user, token) => set({ user, token, isAuthenticated: true, loading: false }),
            logout: () => set({ user: null, token: null, isAuthenticated: false, loading: false }),
            setLoading: (loading) => set({ loading }),
        }),
        {
            name: 'auth-storage',
        }
    )
);
