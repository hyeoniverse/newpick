import { create } from 'zustand';
import { User } from '@/models/user.model';

interface AuthState {
	user: User | null;
	setUser: (user: User | null) => void;
	clearUser: () => void;
	isLoading: boolean;
	setIsLoading: (isLoading: boolean) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
	user: null,
	setUser: (user) => set({ user: user, isLoading: false }),
	clearUser: () => set({ user: null, isLoading: true }),
	isLoading: true,
	setIsLoading: (isLoading) =>
		set({
			isLoading,
		}),
}));
