'use client';

import { useOpenSubscribe } from '@/hooks/useOpenSubscribe';

import styled, { useTheme } from 'styled-components';
import Button from '@/components/common/Button';

interface Props {
	className?: string;
}

function SubscribeInduce({ className }: Props) {
	// 마이페이지로 보내지 않고 이 자리에서 구독 (#52)
	const openSubscribe = useOpenSubscribe();
	const { name: themeName } = useTheme();

	return (
		<SubscribeInduceStyled className={className} $themeName={themeName}>
			<p>뉴픽이 보내드리는 뉴스레터를 구독해보세요!</p>
			<Button scheme="primary" size="medium" onClick={() => openSubscribe()}>
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
	border-radius: ${({ theme }) => theme.radius.surface};
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
		border-radius: ${({ theme }) => theme.radius.control};
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
