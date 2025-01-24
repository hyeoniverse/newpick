import { create } from 'zustand';
import { User } from '@/models/user.model';

interface AuthState {
	user: User | null | undefined;
	setUser: (user: User | null) => void;
	clearUser: () => void;
	isLoading: boolean;
	setIsLoading: (isLoading: boolean) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
	user: undefined,
	setUser: (user) => set({ user, isLoading: true }),
	clearUser: () => set({ user: undefined, isLoading: true }),
	isLoading: true,
	setIsLoading: (isLoading) =>
		set({
			isLoading,
		}),
}));
