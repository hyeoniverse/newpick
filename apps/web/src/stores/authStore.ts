import { create } from 'zustand';
import { User } from '@/models/user.model';

interface AuthState {
	user: User | null;
	setUser: (user: User | null) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
	user: null,
	setUser: (user) => set({ user }),
}));
