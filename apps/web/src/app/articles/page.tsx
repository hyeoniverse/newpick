'use client';

import { useNewsletter } from '@/hooks/useNewsletter';
import { filterTodayTrends, filterTopTrends, sortNewsletters } from '@/utils/queryNewsletters';

import { styled } from 'styled-components';
import Text from '@/components/common/Text';
import Title from '@/components/common/Title';
import Button from '@/components/common/Button';
import FullWidthPanel from '@/components/common/FullWidthPanel';
import Card from '@/components/common/Card';
import CardSlider from '@/components/common/slider/CardSlider';
import { IoHeartOutline } from 'react-icons/io5';
import Spinner from '@/components/common/loader/Spinner';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Newsletter as INewsletter } from '@/models/newsletter.model';

const NewsletterPage = () => {
	const { newsletters } = useNewsletter();
	const todayTrends = useMemo(() => filterTodayTrends(newsletters), [newsletters]);
	const topTrends = filterTopTrends(newsletters);

	const [currentPage, setCurrentPage] = useState(1); // 현재 페이지
	const [loadedNewsletters, setLoadedNewsletters] = useState<INewsletter[]>([]); // 로드된 데이터
	const [isLoading, setIsLoading] = useState(false); // 로딩 상태
	const observerRef = useRef<HTMLDivElement | null>(null);

	const ITEMS_PER_PAGE = 10; // 한 번에 로드할 항목 수

	const [selectedSort, setSelectedSort] = useState<'latest' | 'likes' | 'views'>('latest');

	// 현재 페이지 데이터 로드
	const fetchNewsletters = useCallback(
		(page: number) => {
			const startIndex = (page - 1) * ITEMS_PER_PAGE;
			const endIndex = page * ITEMS_PER_PAGE;
			return newsletters.slice(startIndex, endIndex);
		},
		[newsletters]
	);

	// 무한 스크롤을 처리하는 Intersection Observer
	useEffect(() => {
		const observer = new IntersectionObserver(
			([entry]) => {
				// 모든 데이터가 로드되었으면 더 이상 실행하지 않음
				if (entry.isIntersecting && !isLoading && loadedNewsletters.length < newsletters.length) {
					setIsLoading(true);

					// 데이터 로드를 천천히 진행
					setTimeout(() => {
						setCurrentPage((prevPage) => prevPage + 1);
						setIsLoading(false);
					}, 1500);
				}
			},
			{ threshold: 1.0 } // 100% 노출 시 트리거
		);

		const currentObserverRef = observerRef.current;
		if (currentObserverRef) observer.observe(currentObserverRef);

		return () => {
			if (currentObserverRef) observer.unobserve(currentObserverRef);
		};
	}, [isLoading, loadedNewsletters.length, newsletters.length]);

	// 페이지 변경 시 데이터 추가 로드
	useEffect(() => {
		const newItems = fetchNewsletters(currentPage);

		// 이미 불러온 데이터 중복 방지
		if (newItems.length > 0) {
			setLoadedNewsletters((prev) => {
				// 기존 ID와 비교하여 중복 데이터 제거
				const existingIds = new Set(prev.map((item) => item.id));
				const uniqueItems = newItems.filter((item) => !existingIds.has(item.id));

				return [...prev, ...uniqueItems];
			});
		}
	}, [currentPage, fetchNewsletters]);

	// 선택된 정렬 방식에 따라 데이터 정렬
	const sortedNewsletters = sortNewsletters(loadedNewsletters, selectedSort);

	return (
		<StyledNewsletterPage>
			<HeroSection>
				<Title size="extraSmall" weight="semiBold">
					오늘의 트렌드
				</Title>
				<hr />
				<CardSlider
					type="main"
					data={todayTrends.map((trend) => ({
						id: trend.id,
						image: trend.image,
						header: trend.category,
						main: {
							title: trend.title,
							description: trend.summary,
						},
						footer: (
							<>
								<Text color="subText">{trend.date}</Text>
								<div className="right">
									<Button className="rounded-icon-button">
										<IoHeartOutline />
									</Button>
								</div>
							</>
						),
					}))}
				/>
			</HeroSection>

			<FullWidthPanel background="surface">
				<TrendSection>
					<div className="header">
						<Title size="extraSmall" weight="semiBold">
							지금 가장 많이 보는 뉴스레터
						</Title>
					</div>
					<div className="trend-cards">
						{topTrends.map((trend, index) => (
							<Card
								key={index}
								data={{
									id: trend.id,
									image: trend.image,
									header: trend.category,
									main: {
										title: trend.title,
										description: trend.summary,
									},
									footer: (
										<>
											<Text color="subText">{trend.date}</Text>
											<div className="right">
												<Button className="rounded-icon-button">
													<IoHeartOutline />
												</Button>
											</div>
										</>
									),
								}}
							/>
						))}
					</div>
				</TrendSection>
			</FullWidthPanel>

			<ListSection>
				<div className="header">
					<Title size="extraSmall" weight="semiBold">
						전체 뉴스레터
					</Title>
					<div className="right-section">
						<Button data-active={selectedSort === 'latest'} onClick={() => setSelectedSort('latest')}>
							최신순
						</Button>
						<Button data-active={selectedSort === 'likes'} onClick={() => setSelectedSort('likes')}>
							인기순
						</Button>
					</div>
				</div>

				<div className="newsletter-cards">
					<hr />
					{sortedNewsletters.map((newsletter, index) => (
						<Card
							type="list"
							key={`${newsletter.id}-${index}`}
							data={{
								id: newsletter.id,
								image: newsletter.image,
								header: newsletter.category,
								main: {
									title: newsletter.title,
									description: newsletter.summary,
								},
								footer: (
									<>
										<Text color="subText">{newsletter.date}</Text>
										<Button className="rounded-icon-button">
											<IoHeartOutline />
										</Button>
										<div className="right"></div>
									</>
								),
							}}
						/>
					))}
				</div>
				<div ref={observerRef} className="observer">
					{isLoading && <Spinner />}
				</div>
			</ListSection>
		</StyledNewsletterPage>
	);
};

const StyledNewsletterPage = styled.div`
	width: 100%;
	gap: 2rem;

	hr {
		width: 100%;
		border: none;
		border-bottom: 1px solid ${({ theme }) => theme.color.border};
		margin: 0;
		padding: 0;
	}

	.header {
		display: flex;
		flex-direction: row;
		justify-content: space-between;
		align-items: center;
		width: 100%;
		gap: 1rem;

		.right-section {
			display: flex;
			justify-content: flex-end;
			align-items: center;
			gap: 1rem;

			button {
				padding: 0.25rem 0.5rem;

				&[data-active='true'] {
					color: ${({ theme }) => theme.color.primary};
					font-weight: ${({ theme }) => theme.fontWeight.semiBold};
					background: ${({ theme }) => theme.color.tertiary};
				}
			}
		}
	}
`;

const HeroSection = styled.section`
	width: 100%;
	height: fit-content;
	display: flex;
	flex-direction: column;
	justify-content: space-between;
	align-items: flex-start;
	gap: 1rem;
	padding: 3rem 0;

	@media ${({ theme }) => theme.mediaQuery.mobile} {
		flex-wrap: wrap;
	}
`;

const TrendSection = styled.section`
	max-width: ${({ theme }) => theme.layout.width.large};
	height: fit-content;
	display: flex;
	flex-wrap: wrap;
	flex-direction: column;
	justify-content: space-between;
	align-items: flex-start;
	gap: 1rem;

	.trend-cards {
		width: 100%;
		display: grid;
		grid-template-columns: repeat(4, 1fr);
		gap: 1rem;

		@media ${({ theme }) => theme.mediaQuery.tablet} {
			grid-template-columns: repeat(2, 1fr);
		}

		@media ${({ theme }) => theme.mediaQuery.mobile} {
			grid-template-columns: repeat(1, 1fr);
		}
	}
`;

const ListSection = styled.section`
	width: 100%;
	height: fit-content;
	display: flex;
	flex-direction: column;
	justify-content: space-between;
	align-items: flex-start;
	gap: 1rem;

	.newsletter-cards {
		width: 100%;
		display: flex;
		flex-direction: column;
		justify-content: flex-start;
		align-items: center;
	}

	.observer {
		width: 100%;
		display: flex;
		justify-content: center;
		align-items: center;
		margin-top: 1rem;
	}
`;

export default NewsletterPage;
