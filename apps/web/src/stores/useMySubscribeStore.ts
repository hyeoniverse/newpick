import { create } from 'zustand';
import { ArticleDetail as IArticleDetail } from '@/models/article.model';
import { userSubscribeArticles } from '@/hooks/useMySubscribe';

interface ArticleStore {
	userArticles: IArticleDetail[];
	loading: boolean;
	error: string | null;
	fetchUserArticles: (categoryId: number[]) => Promise<void>;
}

export const useArticleStore = create<ArticleStore>((set) => ({
	userArticles: [],
	loading: false,
	error: null,
	fetchUserArticles: async (categoryId: number[]) => {
		set({ loading: true, error: null });

		try {
			const articles = await userSubscribeArticles(categoryId);
			set({ userArticles: articles, loading: false });
		} catch (err: unknown) {
			let errorMessage = 'An unknown error occurred';

			if (err instanceof Error) {
				errorMessage = err.message;
			} else if (typeof err === 'string') {
				errorMessage = err;
			}

			set({ error: errorMessage, loading: false });
		}
	},
}));
