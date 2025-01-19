import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/authStore';

export const useAuth = () => {
	const router = useRouter();
	const { isAuthenticated, user, token, login, logout } = useAuthStore();

	const handleLogin = (user: { id: number; name: string; email: string }, token: string) => {
		login(user, token);
		router.push('/');
	};

	const handleLogout = () => {
		logout();
		router.push('/');
	};

	return {
		isAuthenticated,
		user,
		token,
		handleLogin,
		handleLogout,
	};
};
