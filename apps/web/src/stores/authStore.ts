import { create } from 'zustand';
import { User } from '@/models/user.model';

interface AuthState {
	user: User | null;
	token: string | null;
	isLoading: boolean; // 로그인 상태 확인 중인지 여부
	setUser: (user: User | null) => void;
	setToken: (token: string | null) => void;
	setLoading: (loading: boolean) => void;
	logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
	user: null,
	token: null,
	isLoading: true, // 기본값: true (앱 로드 시 로그인 상태 확인 중)
	setUser: (user) => set({ user, isLoading: false }),
	setToken: (token) => set({ token }),
	setLoading: (loading) => set({ isLoading: loading }),
	logout: () => set({ user: null, token: null, isLoading: false }),
}));
