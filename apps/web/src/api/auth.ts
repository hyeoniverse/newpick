import { API_ENDPOINTS } from '@/constants/api';
import { User } from '@/models/user.model';

// 사용자 정보 조회 API
export const fetchUser = async (token: string, userId: number): Promise<User | null> => {
	if (!userId) return null;

	try {
		const res = await fetch(API_ENDPOINTS.AUTH.USER(userId), {
			method: 'GET',
			credentials: 'include',
			headers: {
				'Content-Type': 'application/json',
				Authorization: `Bearer ${token}`,
			},
		});

		if (!res.ok) {
			if (res.status === 401) throw new Error('Unauthorized');
			throw new Error('Failed to fetch user');
		}

		return await res.json();
	} catch (error) {
		console.error('Failed to fetch user:', error);
		throw error;
	}
};

// 로그아웃 API
export const logoutUser = async (): Promise<void> => {
	const res = await fetch(API_ENDPOINTS.AUTH.LOGOUT, {
		method: 'POST',
		credentials: 'include',
		headers: { 'Content-Type': 'application/json' },
	});

	if (!res.ok) throw new Error('Failed to logout from server');
};
