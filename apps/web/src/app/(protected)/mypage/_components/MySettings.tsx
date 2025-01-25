'use client';

import useSubscribe from '@/hooks/useSubscribe';

import styled from 'styled-components';
import NoContentsPage from '@/components/common/NoContentsPage';
import StartSubscription from '@/app/(protected)/mypage/_components/settings/StartSubscription';

function MyNewsletterSubscribe() {
	const { status: isSubscribed } = useSubscribe();

	console.log('subscriptionStatus:', isSubscribed);

	return (
		<MyNewsletterSubscribeStyled>
			{isSubscribed ? (
				isSubscribed === null ? (
					<NoContentsPage
						text={`뉴스레터 구독이 일시정지 중 입니다. \n 구독을 다시 시작하시겠습니까?`}
						btnText={'일시정지 해제하기'}
						onClick={() => {}}
					/>
				) : (
					<StartSubscription />
				)
			) : (
				<StartSubscription />
			)}
		</MyNewsletterSubscribeStyled>
	);
}

const MyNewsletterSubscribeStyled = styled.div``;

export default MyNewsletterSubscribe;
