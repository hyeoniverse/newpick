'use client';

import { useAuth } from '@/hooks/useAuth';
import useSubscribe from '@/hooks/useSubscribe';
import NoContentsPage from '@/components/common/NoContentsPage';
import StartSubscription from '@/app/(protected)/mypage/_components/settings/StartSubscription';

export default function MyNewsletterSubscribe() {
	const { user } = useAuth();
	const { status: isSubscribed = user?.isSubscribed } = useSubscribe();

	return (
		<div>
			{isSubscribed === null || true ? (
				<StartSubscription />
			) : (
				<NoContentsPage
					text={`뉴스레터 구독이 일시정지 중 입니다. \n 구독을 다시 시작하시겠습니까?`}
					btnText={'일시정지 해제하기'}
					onClick={() => {}}
				/>
			)}
		</div>
	);
}
