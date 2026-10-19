import { API_ENDPOINTS } from '@/constants/api';
import { apiFetch } from '@/api/client';
import { ArticleDetail } from '@/models/article.model';

export type TrialSummaryResponse = {
	newsletter: Partial<ArticleDetail> & {
		title: string;
		categoryId: number;
		html: string;
		/** 요약에 쓴 원문 링크들을 쉼표로 이은 문자열 */
		newslinks?: string;
	};
};

/** 무료 체험 요약. 서버가 항상 체험 모드로 처리하고, 같은 요청은 캐시된 결과를 돌려줍니다. */
export const summarizeNews = async (categoryId: number, dateStart: string, dateEnd: string = dateStart) =>
	apiFetch<TrialSummaryResponse>(API_ENDPOINTS.NEWSLETTER.SUMMARIZE(), {
		method: 'POST',
		body: { dateStart, dateEnd, categoryId },
	});
