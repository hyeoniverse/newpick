import { useQuery } from '@tanstack/react-query';
import { fetchTrendList } from '@/api/article';
import { ArticleSummary } from '@/models/article.model';
import { parseArticles } from '@/utils/parseArticles';

export const TRENDS_QUERY_KEY = ['trends'] as const;

/**
 * 트렌드 목록. 서버 렌더링 때 받은 값을 Providers가 이 쿼리 캐시에 넣어 두므로 첫 화면에서 다시 요청하지 않습니다.
 * (이전에는 같은 데이터를 React Query와 Zustand에 이중으로 저장했습니다.)
 */
export const useTrends = () => {
	const { data, error, isLoading } = useQuery<ArticleSummary[]>({
		queryKey: TRENDS_QUERY_KEY,
		queryFn: async () => parseArticles(await fetchTrendList()),
		staleTime: 1000 * 60 * 5,
		retry: 1,
	});

	return { trends: data ?? [], isLoading, isSuccess: !isLoading && !error, isError: !!error };
};
