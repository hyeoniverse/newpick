import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

interface User {
	id: number;
	name: string;
	email: string;
}

interface AuthState {
	isAuthenticated: boolean;
	user: User | null;
	token: string | null;
	login: (user: User, token: string) => void;
	logout: () => void;
}

// `typeof window !== 'undefined'` 체크하여 SSR에서 `localStorage` 접근 방지
const storage =
	typeof window !== 'undefined'
		? createJSONStorage(() => localStorage) // 클라이언트 환경에서는 `localStorage` 사용
		: undefined; // SSR 환경에서는 `undefined`로 설정

export const useAuthStore = create<AuthState>()(
	persist(
		(set) => ({
			isAuthenticated: false,
			user: null,
			token: null,

			login: (user, token) => {
				set({ isAuthenticated: true, user, token });
			},

			logout: () => {
				set({ isAuthenticated: false, user: null, token: null });
			},
		}),
		{
			name: 'auth-storage', // LocalStorage에 저장될 키
			storage, // SSR 환경에서 `undefined`, 클라이언트에서는 `localStorage`
		}
	)
);
