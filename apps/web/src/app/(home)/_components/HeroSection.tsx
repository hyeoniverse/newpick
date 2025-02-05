'use client';

import { useModal } from '@/hooks/useModal';
import styled from 'styled-components';
import Title from '@/components/common/Title';
import Button from '@/components/common/Button';
import Trial from '@/app/(home)/_components/Trial';

export default function HeroSection() {
	const { openModal } = useModal();

	const handleOpenModal = () => {
		openModal(<Trial />);
	};

	return (
		<StyledHeroSection>
			<div className="content">
				<div className="left-section">
					<div className="description">
						<Title size="small">새로운 AI 구독 서비스</Title>
						<Title size="large" weight="semiBold">
							원하는 분야만 골라보는 나만의 뉴스
						</Title>
					</div>
					<Button size="large" scheme="primary" style={{ marginTop: '1rem' }} onClick={handleOpenModal}>
						AI 뉴스레터 체험하기
					</Button>
				</div>
			</div>
		</StyledHeroSection>
	);
}

const StyledHeroSection = styled.section`
	width: 100%;
	height: fit-content;

	display: flex;
	flex-direction: column;
	justify-content: space-between;
	align-items: center;

	gap: 2rem;
	padding: 1rem 0 2rem 0;
	margin-bottom: 4rem;

	.header {
		width: 100%;
		display: flex;
		flex-direction: column;
		justify-content: flex-start;
		align-items: flex-start;
	}

	.content {
		width: 100%;
		height: fit-content;
		display: flex;
		flex-direction: row;
		justify-content: center;
		align-items: center;

		.left-section {
			width: 100%;
			height: 100%;

			display: flex;
			flex-wrap: wrap;
			flex-direction: column;
			justify-content: space-between;
			align-items: center;
			padding: 2rem 0;

			.description {
				text-align: center;
				align-items: center;
			}
		}

		img {
			border-radius: ${({ theme }) => theme.borderRadius.soft};
			box-shadow: ${({ theme }) => theme.shadow.medium};
		}

		@media ${({ theme }) => theme.mediaQuery.tablet} {
			flex-wrap: wrap;
		}
	}
`;
