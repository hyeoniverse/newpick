import { create } from 'zustand';
import { ArticleSummary as IArticleSummary } from '@/models/article.model';
import { getNewsletters } from '@/utils/generateRandomData';

interface NewsletterState {
	newsletters: IArticleSummary[];
	initializeNewsletters: () => void; // 초기화를 위한 함수 추가
}

const useNewsletterStore = create<NewsletterState>((set, get) => ({
	newsletters: [], // 초기 상태를 빈 배열로 설정
	initializeNewsletters: () => {
		const currentNewsletters = get().newsletters;
		if (currentNewsletters.length === 0) {
			// 뉴스레터가 없을 경우에만 생성
			set({ newsletters: getNewsletters() });
		}
	},
}));

export default useNewsletterStore;
