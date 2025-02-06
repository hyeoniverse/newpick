'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useTab } from '@/hooks/useTab';
import { useModal } from '@/hooks/useModal';

import styled, { useTheme } from 'styled-components';
import Button from '@/components/common/Button';
import ModalContent from '@/components/common/modal/ModalContent';
import { BiSolidMessageRoundedError } from 'react-icons/bi';
import { LuMailCheck } from 'react-icons/lu';

interface Props {
	className?: string;
}

function SubscribeInduce({ className }: Props) {
	const router = useRouter();
	const { user } = useAuth();
	const { setActiveTab } = useTab();
	const [isSubscribeClicked, setIsSubscribeClicked] = useState(false);
	const { openModal, closeModal } = useModal();

	const { themeName } = useTheme();

	useEffect(() => {
		if (isSubscribeClicked && user) {
			router.push(`/mypage?tab=settings`);
			setActiveTab('settings');
			setIsSubscribeClicked(false);
		}
	}, [user, isSubscribeClicked, setActiveTab, router]);

	const onClickSubscribe = () => {
		if (user && user.isSubscribed !== true) {
			setActiveTab('settings');
			router.push(`/mypage?tab=settings`);
			closeModal();
		} else if (user && user.isSubscribed) {
			openModal(
				<ModalContent
					icon={<LuMailCheck />}
					title="이미 구독중입니다."
					content="구독중인 뉴스레터가 있습니다."
					filledButton="확인"
					onConfirmClick={closeModal}
				/>
			);
		} else {
			setIsSubscribeClicked(true);
			// handleLogin();

			openModal(
				<ModalContent
					icon={<BiSolidMessageRoundedError />}
					title="로그인이 필요합니다."
					content="로그인 후 이용해주세요."
					filledButton="확인"
					onConfirmClick={closeModal}
				/>
			);
		}
	};

	return (
		<SubscribeInduceStyled className={className} $themeName={themeName}>
			<p>뉴픽이 보내드리는 뉴스레터를 구독해보세요!</p>
			<Button scheme="primary" size="medium" onClick={onClickSubscribe}>
				구독하기
			</Button>
		</SubscribeInduceStyled>
	);
}

interface StyledProps {
	$themeName: 'light' | 'dark';
}

const SubscribeInduceStyled = styled.div<StyledProps>`
	background-color: ${({ theme }) => theme.color.tertiary};
	border-radius: ${({ theme }) => theme.borderRadius.soft};
	padding: 2rem 4rem;
	gap: 2rem;

	display: flex;
	flex-direction: row;
	align-items: center;

	p {
		width: 100%;
		font-size: ${({ theme }) => theme.fontSize.extraLarge};
		font-weight: ${({ theme }) => theme.fontWeight.semiBold};
		background: ${({ $themeName }) =>
			$themeName === 'light'
				? 'linear-gradient(to right top, #0c0042, #2d11b1, #5537dd, #0e004d)'
				: 'linear-gradient(to right top, #3b1d91, #5b40e0, #7761ff, #a28eff)'};
		color: transparent;
		-webkit-background-clip: text;

		word-break: keep-all;
	}

	button {
		width: 10rem;
		height: 2.875rem;
		border-radius: ${({ theme }) => theme.borderRadius.soft};
		font-size: ${({ theme }) => theme.fontSize.medium};
	}

	@media screen and ${({ theme }) => theme.mediaQuery.tablet} {
		flex-direction: column;
		text-align: center;
		gap: 1rem;
		padding: 2rem;
	}

	@media screen and ${({ theme }) => theme.mediaQuery.mobile} {
		flex-direction: column;
		text-align: center;
		gap: 1rem;
		padding: 2rem;
	}
`;

export default SubscribeInduce;
