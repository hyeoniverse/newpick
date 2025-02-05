import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { fetchTrendList } from '@/api/article';
import { useTrendStore } from '@/stores/useTrendsStore';
import { parseArticles } from '@/utils/parseArticles';

export const useTrends = () => {
	const { trends, setTrends, setLoading, setSuccess, setError } = useTrendStore();

	const { data, error, isLoading } = useQuery({
		queryKey: ['trends'],
		queryFn: async () => {
			setLoading(); // 요청 시작 시 로딩 상태 변경
			try {
				const articles = await fetchTrendList();
				const parsedData = parseArticles(articles);
				setTrends(parsedData);
				setSuccess(); // 성공 상태 변경
				return parsedData;
			} catch (err) {
				setError(); // 실패 상태 변경
				throw err;
			}
		},
		staleTime: 1000 * 60 * 5, // 5분 동안 캐싱
		retry: 1, // 실패 시 1회 재시도
	});

	useEffect(() => {
		if (data) {
			setTrends(data);
		}
	}, [data, setTrends]);

	return { trends, isLoading, isSuccess: !isLoading && !error, isError: !!error };
};
