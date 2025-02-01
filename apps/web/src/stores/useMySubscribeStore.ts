import { create } from 'zustand';
import { IArticleDetail } from '@/models/article.model';
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
    // 로딩 상태 업데이트
    set({ loading: true, error: null });
    try {
      const articles = await userSubscribeArticles(categoryId);
      set({ userArticles: articles, loading: false });
    } catch (err: any) {
      set({ error: err.message || 'Error occurred', loading: false });
    }
  },
}));
