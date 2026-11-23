'use client';

import { Fragment, useRef } from 'react';
import { useInOut } from '@/hooks/useInOut';
import { useModal } from '@/hooks/useModal';
import Title from '@/components/common/Title';
import Button from '@/components/common/Button';
import Trial from '@/app/(home)/_components/Trial';

const TITLE = '원하는 분야만 골라보는 나만의 뉴스';
const WORDS = TITLE.split(' ');

/**
 * 체험하기 칸 (CTA). 스크롤해서 화면에 들어오면 나타난다 (styles/pages/home.css .np-try):
 * 위에서 아래로: 꼬리표가 나타나고 → 제목이 낱말마다 위에서 떨어지듯 들어오고 → 버튼이 내려앉은 뒤 빛이 한 번 지나간다.
 * 화면에 들어올 때마다 다시 재생하고, 벗어날 때는 퇴장한다 (제목은 아래로 빠지고 꼬리표 · 버튼은 아래로 흐려진다). 표시 규칙은 useInOut
 */
export default function HeroSection() {
	const { openModal } = useModal();
	const section = useRef<HTMLElement>(null);

	useInOut(section);

	const handleOpenModal = () => {
		openModal(<Trial />, { size: 'large' });
	};

	return (
		<section ref={section} className="np-home-hero-section-hero-section np-try" data-track-section="home-hero">
			<div className="content">
				<div className="left-section">
					<div className="description">
						<Title as="p" size="small" className="np-try-eyebrow">
							새로운 AI 구독 서비스
						</Title>
						<Title as="h2" size="large" weight="semiBold" className="np-try-title">
							{/* 낱말마다 감싸 하나씩 위에서 떨어지듯 들어오게. 띄어쓰기는 낱말 상자 밖에 둔다 (안에 두면 상자 끝에서 지워진다) */}
							{WORDS.map((word, i) => (
								<Fragment key={word}>
									{i > 0 && ' '}
									<span className="np-try-word" style={{ '--w': i } as React.CSSProperties}>
										<span>{word}</span>
									</span>
								</Fragment>
							))}
						</Title>
					</div>
					<Button
						size="large"
						scheme="primary"
						className="np-try-cta"
						style={{ marginTop: '1rem' }}
						onClick={handleOpenModal}
					>
						AI 뉴스레터 체험하기
					</Button>
				</div>
			</div>
		</section>
	);
}
