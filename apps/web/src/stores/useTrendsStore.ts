import { create } from 'zustand';
import { ArticleSummary } from '@/models/article.model';

interface TrendState {
	trends: ArticleSummary[];
	isLoading: boolean;
	isSuccess: boolean;
	isError: boolean;
	setTrends: (trends: ArticleSummary[]) => void;
	setLoading: () => void;
	setSuccess: () => void;
	setError: () => void;
}

export const useTrendStore = create<TrendState>((set) => ({
	trends: [],
	isLoading: false,
	isSuccess: false,
	isError: false,

	setTrends: (trends) => set({ trends, isLoading: false, isSuccess: true, isError: false }),
	setLoading: () => set({ isLoading: true, isSuccess: false, isError: false }),
	setSuccess: () => set({ isLoading: false, isSuccess: true, isError: false }),
	setError: () => set({ isLoading: false, isSuccess: false, isError: true }),
}));
