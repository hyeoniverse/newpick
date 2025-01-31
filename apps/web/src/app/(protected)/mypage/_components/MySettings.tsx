'use client';

import useSubscribe from '@/hooks/useSubscribe';
import NoContentsPage from '@/components/common/NoContentsPage';
import StartSubscription from '@/app/(protected)/mypage/_components/settings/StartSubscription';

interface Props {
	status: boolean;
	interests: string[];
}

export default function MyNewsletterSubscribe({ status, interests }: Props) {
	const { status: isSubscribed = status } = useSubscribe();

	return (
		<div>
			{isSubscribed === null || true ? (
				<StartSubscription status={status} interests={interests} />
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
