import { API_ENDPOINTS } from '@/constants/api';
import { apiFetch } from '@/api/client';

export const increaseViewCount = async (newsletterId: number) =>
	apiFetch<{ data: number }>(API_ENDPOINTS.NEWSLETTER.VIEW_COUNT(newsletterId), { method: 'POST' });
