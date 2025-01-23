import { create } from 'zustand';
import { User } from '@/models/user.model';

interface AuthState {
	user: User | null;
	isAuthenticated: boolean;
	login: (user: AuthState['user']) => void;
	logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
	user: null,
	isAuthenticated: false,
	login: (user) =>
		set({
			user,
			isAuthenticated: !!user, // user가 존재하면 true, 없으면 false
		}),
	logout: () =>
		set({
			user: null,
			isAuthenticated: false,
		}),
}));
