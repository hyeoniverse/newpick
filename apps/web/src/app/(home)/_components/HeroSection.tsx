'use client';

import { useModal } from '@/hooks/useModal';
import { bannersData } from '@/mocks/home/index';

import { styled } from 'styled-components';
import Title from '@/components/common/Title';
import Button from '@/components/common/Button';
import BannerSlider from '@/components/common/slider/BannerSlider';

const HeroSection = () => {
	const { openModal } = useModal();

	return (
		<StyledHeroSection>
			<div className="left-section">
				<div className="description">
					<Title size="small">새로운 AI 구독 서비스</Title>
					<Title size="large" weight="semiBold">
						원하는 분야만 골라보는 나만의 뉴스
					</Title>
				</div>
				<Button
					size="large"
					scheme="primary"
					style={{ marginTop: '1rem' }}
					onClick={() =>
						openModal(
							<>
								<Title size="medium">뉴스레터 생성하기</Title>
								<Button>생성하기</Button>
							</>
						)
					}
				>
					AI 뉴스레터 체험하기
				</Button>
			</div>
			<BannerSlider banners={bannersData} />
		</StyledHeroSection>
	);
};

const StyledHeroSection = styled.section`
	width: 100%;
	height: fit-content;
	display: flex;

	flex-direction: row;
	justify-content: space-between;
	align-items: center;
	gap: 2rem;
	padding: 1rem 0 2rem 0;

	.left-section {
		width: 100%;
		height: 100%;

		display: flex;
		flex-wrap: wrap;
		flex-direction: column;
		justify-content: space-between;
		align-items: flex-start;
		padding: 2rem 0;
	}

	img {
		border-radius: ${({ theme }) => theme.borderRadius.soft};
		box-shadow: ${({ theme }) => theme.shadow.medium};
	}

	@media ${({ theme }) => theme.mediaQuery.tablet} {
		flex-wrap: wrap;
	}
`;

export default HeroSection;
