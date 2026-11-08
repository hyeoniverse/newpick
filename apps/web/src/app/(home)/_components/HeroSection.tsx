'use client';

import { useModal } from '@/hooks/useModal';
import Title from '@/components/common/Title';
import Button from '@/components/common/Button';
import Trial from '@/app/(home)/_components/Trial';
import { cx } from '@/styles/tw';

export default function HeroSection() {
	const { openModal } = useModal();

	const handleOpenModal = () => {
		openModal(<Trial />, { size: 'large' });
	};

	return (
		<StyledHeroSection data-track-section="home-hero">
			<div className="content">
				<div className="left-section">
					<div className="description">
						<Title as="p" size="small">
							새로운 AI 구독 서비스
						</Title>
						<Title as="h2" size="large" weight="semiBold">
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

const StyledHeroSection = ({ className, ...props }: React.ComponentProps<'section'>) => (
	<section className={cx('np-home-hero-section-hero-section', className)} {...props} />
);
