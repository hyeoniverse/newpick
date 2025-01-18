import { useEffect } from 'react';
import useLoadingStore from '@/stores/loadingStore';
import useNewsletterStore from '@/stores/newsletterStore';

export const useNewsletter = () => {
	const { setLoading } = useLoadingStore();
	const newsletters = useNewsletterStore((state) => state.newsletters);
	const initializeNewsletters = useNewsletterStore((state) => state.initializeNewsletters);

	useEffect(() => {
		const loadData = async () => {
			setLoading(true); // 로딩 시작
			initializeNewsletters(); // 데이터 초기화
			setLoading(false); // 로딩 종료
		};
		loadData();
	}, [initializeNewsletters, setLoading]);

	return { newsletters, initializeNewsletters };
};
