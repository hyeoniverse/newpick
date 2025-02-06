'use client';

import { useEffect, useState } from 'react';
import { useTab } from '@/hooks/useTab';
import useSubscribe from '@/hooks/useSubscribe';

import styled from 'styled-components';
import NoContentsPage from '@/components/common/NoContentsPage';
import MySubscribeNav from '@/app/(protected)/mypage/_components/subscribe/MySubscribeNav';
import MySummaryCategory from '@/app/(protected)/mypage/_components/subscribe/MySubscribeSummaryCategory';
import { useAuth } from '@/hooks/useAuth';
import { useTrends } from '@/hooks/useTrends';

export default function MySubscribe() {
	const { user } = useAuth();
	const { trends } = useTrends();
	const { setActiveTab } = useTab();
	const { status: isSubscribed = user?.isSubscribed } = useSubscribe();
	const [activeCategory, setActiveCategory] = useState<string>('');
	const [isAtBottom, setIsAtBottom] = useState<boolean>(false); // ⬅️ 스크롤이 맨 아래에 있는지 체크하는 상태

	const handleConfirm = () => {
		setActiveTab('settings');
	};

	// 스크롤이 끝까지 내려갔을 때 마지막 카테고리 설정
	const handleScroll = () => {
		const sections = document.querySelectorAll<HTMLElement>('.my-subs-content');
		const lastSection = sections[sections.length - 1];

		if (window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 10) {
			if (lastSection) {
				const lastCategoryId = lastSection.dataset.categoryid || '';
				// console.log('✅ 스크롤 맨 아래 도달:', lastCategoryId);

				//  스크롤이 맨 아래에 도달한 경우 activeCategory 고정
				setIsAtBottom(true);
				setActiveCategory(lastCategoryId);
			}
		} else {
			// 스크롤이 맨 아래가 아닐 경우 IntersectionObserver가 다시 동작하도록 설정
			setIsAtBottom(false);
		}
	};

	// IntersectionObserver로 현재 화면에 나타난 섹션 감지 + 스크롤 이벤트 추가
	useEffect(() => {
		if (!isSubscribed) return;

		const sections = document.querySelectorAll<HTMLElement>('.my-subs-content');
		const visibleSet = new Set<HTMLElement>();

		const observer = new IntersectionObserver(
			(entries) => {
				if (isAtBottom) return; //  스크롤이 맨 아래일 때는 IntersectionObserver가 실행되지 않도록 차단

				entries.forEach((entry) => {
					if (entry.isIntersecting) {
						visibleSet.add(entry.target as HTMLElement);
					} else {
						visibleSet.delete(entry.target as HTMLElement);
					}
				});

				// 현재 보이는 섹션 중 가장 위에 있는 섹션의 categoryId를 activeCategory로 설정
				if (visibleSet.size > 0) {
					const sorted = Array.from(visibleSet).sort((a, b) => {
						const rectA = a.getBoundingClientRect();
						const rectB = b.getBoundingClientRect();
						return rectA.top - rectB.top;
					});

					const newActiveCategory = sorted[0].dataset.categoryid || '';
					// console.log('🎯 새로운 활성 카테고리:', newActiveCategory);

					if (activeCategory !== newActiveCategory) {
						setActiveCategory(newActiveCategory);
					}
				}
			},
			{
				threshold: 0.3,
				rootMargin: '0px 0px -10% 0px',
			}
		);

		sections.forEach((section) => observer.observe(section));
		window.addEventListener('scroll', handleScroll);

		return () => {
			sections.forEach((section) => observer.unobserve(section));
			window.removeEventListener('scroll', handleScroll);
		};
	}, [isSubscribed, trends, activeCategory, isAtBottom]); // ⬅️ isAtBottom 상태가 변경될 때도 useEffect 실행

	// 구독중이면 네비 + 컨텐츠 표시, 아니면 NoContentsPage 표시
	return (
		<>
			{isSubscribed === null ? (
				<NoContentsPage
					text={`뉴스레터를 구독 중이 아닙니다.
            새로운 뉴스레터 구독을 시작해보시겠습니까?`}
					btnText={'구독 바로가기'}
					onClick={handleConfirm}
				/>
			) : (
				<>
					<MySubscribeNav activeCategory={activeCategory} />
					<MySubscribeStyled>
						<MySummaryCategory />
					</MySubscribeStyled>
				</>
			)}
		</>
	);
}

const MySubscribeStyled = styled.div`
	position: relative;
	max-width: 1024px;
	margin: 0 auto;
`;
