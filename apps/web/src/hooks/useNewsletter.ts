import { useEffect, useState } from 'react';
import useLoadingStore from '@/stores/useLoadingStore';
import useNewsletterStore from '@/stores/useNewsletterStore';

export const useNewsletter = () => {
	const { setLoading } = useLoadingStore();
	const newsletters = useNewsletterStore((state) => state.newsletters);
	const initializeNewsletters = useNewsletterStore((state) => state.initializeNewsletters);
	const [isDataLoaded, setIsDataLoaded] = useState(false); // 로딩 상태 추가

	useEffect(() => {
		const loadData = async () => {
			setLoading(true); // 로딩 시작
			await initializeNewsletters(); // 비동기 데이터 로드
			setIsDataLoaded(true); // 데이터 로드 완료 후 변경
			setLoading(false); // 데이터가 완전히 로드된 후 로딩 종료
		};

		if (!isDataLoaded) {
			console.log('newsletters', newsletters);
			loadData();
		}
	}, [initializeNewsletters, setLoading, isDataLoaded, newsletters]);

	return { newsletters, initializeNewsletters };
};
