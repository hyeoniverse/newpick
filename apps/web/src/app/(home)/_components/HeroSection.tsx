'use client';

import { useModal } from '@/hooks/useModal';
import Title from '@/components/common/Title';
import Button from '@/components/common/Button';
import Trial from '@/app/(home)/_components/Trial';

export default function HeroSection() {
	const { openModal } = useModal();

	const handleOpenModal = () => {
		openModal(<Trial />, { size: 'large' });
	};

	return (
		<section className="np-home-hero-section-hero-section" data-track-section="home-hero">
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
		</section>
	);
}
