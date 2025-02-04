import { API_ENDPOINTS } from '@/constants/api';

export const increaseViewCount = async (newsletterId: number) => {
	try {
		const response = await fetch(API_ENDPOINTS.NEWSLETTER.VIEW_COUNT(newsletterId), {
			method: 'POST',
			credentials: 'include',
			headers: {
				'Content-Type': 'application/json',
			},
		});

		if (!response.ok) {
			throw new Error(`Error: ${response.status} ${response.statusText}`);
		}

		return await response.json();
	} catch (error) {
		console.error('Failed to summarize news:', error);
		throw error;
	}
};
