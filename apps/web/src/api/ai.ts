import { API_ENDPOINTS } from '@/constants/api';

export const summarizeNews = async (categoryId: number, dateStart: string, dateEnd?: string) => {
	if (!dateEnd) {
		dateEnd = dateStart;
	}

	try {
		const response = await fetch(API_ENDPOINTS.NEWSLETTER.SUMMARIZE(), {
			method: 'POST',
			credentials: 'include',
			headers: {
				'Content-Type': 'application/json',
			},
			body: JSON.stringify({ dateStart, dateEnd, categoryId }),
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
