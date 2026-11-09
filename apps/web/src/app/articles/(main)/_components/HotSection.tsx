'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArticleSummary as IArticleSummary } from '@/models/article.model';
import { CATEGORIES } from '@/constants/categories';

import { LuCoffee, LuCpu, LuGlobe, LuLandmark, LuNewspaper, LuTrendingUp, LuUsers } from 'react-icons/lu';
import Title from '@/components/common/Title';
import Text from '@/components/common/Text';
import CardSlider from '@/components/common/slider/CardSlider';
import BookmarkIcon from '@/components/common/icons/BookmarkIcon';
import { mapIdToTitle } from '@/utils/mapInterests';
import { filterByCategories } from '@/utils/queryNewsletters';
import { PERIOD_OPTIONS, isSearching, readFilters, toPageHref } from '@/utils/newsletterSearch';
import { kstDate } from '@/utils/formatter';
import InputSelect from '@/components/common/InputSelect';
import SearchFilters from '@/app/articles/(main)/_components/SearchFilters';

/** 분야 페이지 배너 요약 (page.tsx가 서버에서 계산) */
export interface CategoryStats {
	/** 최근 7일 발행 편 수 */
	weekCount: number;
}

/** 띠 오른쪽에 크게·옅게 까는 분야 아이콘 */
const CATEGORY_ICONS: Record<string, React.ReactNode> = {
	전체: <LuNewspaper />,
	IT: <LuCpu />,
	정치: <LuLandmark />,
	경제: <LuTrendingUp />,
	사회: <LuUsers />,
	생활: <LuCoffee />,
	세계: <LuGlobe />,
};

interface Props {
	trends?: IArticleSummary[];
	stats?: CategoryStats;
	/** 분야 페이지: 오늘 이 분야 뉴스레터가 없을 때 배너에 대신 띄울 가장 최근 것 */
	latest?: IArticleSummary;
}

export default function HotSection({ trends: initiallData = [], stats, latest }: Props) {
	const router = useRouter();
	const searchParams = useSearchParams();
	const filters = readFilters(searchParams);
	const categoryName = mapIdToTitle([filters.categoryId])[0]; // Query Parameter를 카테고리 이름으로 변환
	// 검색어 · 키워드 · 기간으로 찾는 중이면 오늘의 배너 대신 결과만 (#20)
	const filtering = isSearching(filters) || filters.period !== 'all';
	const isAll = categoryName === '전체';
	const category = CATEGORIES.find((c) => c.name === categoryName);
	let filteredTrends = [...initiallData];

	if (!isAll) {
		filteredTrends = filterByCategories(initiallData, [categoryName]);
	}
	// 오늘 이 분야 뉴스레터가 없으면 이 분야의 가장 최근 것으로 (분야마다 배너가 있다 없다 하지 않게). 그것도 없으면 배너를 통째로 뺀다
	const fallback = !isAll && filteredTrends.length === 0 && latest;
	if (fallback) filteredTrends = [latest];

	return (
		<section
			className="np-articles-hot-section-hot-section"
			data-track-section="articles-hot"
			// 점·화살표 줄: 분야 페이지(카드 하나)에서도 자리는 남겨 높이를 맞춘다
			style={{ '--hot-controls-visibility': isAll ? 'visible' : 'hidden' } as React.CSSProperties}
		>
			{/* 분야 사이를 바로 옮기는 칩 (헤더 하위 메뉴를 열지 않아도) */}
			<nav className="category-chips" aria-label="관심사">
				{CATEGORIES.map((c) => (
					<Link
						key={c.id}
						// 관심사를 바꿔도 검색어 · 기간 · 정렬은 그대로. 고른 관심사를 다시 누르면 전체로
						href={toPageHref({ ...filters, categoryId: c.name === categoryName ? 0 : c.id })}
						className="chip"
						aria-current={c.name === categoryName ? 'page' : undefined}
					>
						{c.name}
					</Link>
				))}
			</nav>

			{/* 태블릿 · 휴대폰: 분야 칩 두 줄 · 기간 줄 대신 고르기 칸 두 개 한 줄 (위쪽을 가볍게). 직접 지정의 날짜 칸은 아래 기간 줄에 */}
			<div className="compact-filters" role="group" aria-label="분야 · 기간">
				<InputSelect
					name="category"
					size="small"
					ariaLabel="분야"
					value={String(filters.categoryId)}
					options={CATEGORIES.map((c) => ({ value: String(c.id), label: c.name }))}
					onChange={(value) => router.push(toPageHref({ ...filters, categoryId: Number(value) }), { scroll: false })}
				/>
				<InputSelect
					name="period"
					size="small"
					ariaLabel="기간"
					value={filters.period}
					options={PERIOD_OPTIONS}
					onChange={(value) => {
						const period = PERIOD_OPTIONS.find((o) => o.value === value)?.value ?? 'all';
						router.replace(
							toPageHref(
								period === 'custom'
									? { ...filters, period, from: filters.from || kstDate(29), to: filters.to || kstDate(0) }
									: { ...filters, period },
							),
							{ scroll: false },
						);
					}}
				/>
			</div>

			<SearchFilters />

			{!filtering && (
				<>
					<div className="intro">
						<span className="watermark" aria-hidden>
							{CATEGORY_ICONS[categoryName]}
						</span>
						<Title size="large" weight="semiBold">
							{categoryName} 뉴스레터
						</Title>
						{category?.description && (
							<Text size="medium" color="subText" className="description">
								{category.description}을 매일 아침 정리합니다.
							</Text>
						)}
						{/* 요약 줄은 전체·분야 모두 같은 자리에 한 줄 (분야를 바꿔도 높이가 같게) */}
						<p className="stats">
							<span className="count">
								{isAll ? (
									<>
										오늘 <strong>{initiallData.length}개 분야</strong> 발행
									</>
								) : (
									<>
										최근 7일 <strong>{stats?.weekCount ?? 0}편</strong>
									</>
								)}
							</span>
						</p>
					</div>
					<hr />
					{/* 화면 폭 전체의 옅은 강조색 띠(::before) 위에 오늘의 톱 카드(흰 카드·그림자)를 올려 한 단계 떠 보이게 */}
					{filteredTrends.length > 0 && (
						<div className="stage">
							<h2 className="stage-head">
								<span className="label">{fallback ? 'LATEST' : 'TODAY'}</span>
								<Text size="small" color="subText" className="today">
									{fallback
										? `${dayLabel(latest.date)} · 최근 ${categoryName} 뉴스레터`
										: `${todayLabel()} · 오늘의 ${isAll ? '톱' : categoryName} 뉴스레터`}
								</Text>
							</h2>
							<CardSlider
								className="card-slider"
								type="main"
								data={filteredTrends.map((trend) => ({
									id: trend.id,
									image: trend.image,
									// 분야 페이지는 제목에 이미 분야가 있어, 같은 자리에 소식 수를 둔다 (높이 유지)
									header: isAll ? trend.categoryName : `소식 ${trend.stories?.length || 1}개`,
									main: {
										title: trend.title,
										// 부제목이 있으면 본문 앞부분 대신 (#42)
										description: trend.subtitle || trend.summary,
										tags: trend.keywords,
										// 이 뉴스레터에 담긴 소식 (전체·분야 같은 모양)
										points: trend.stories,
									},
									footer: (
										<>
											<Text color="subText">{trend.date}</Text>
											<Text color="subText">|&nbsp;&nbsp;조회수 {trend.views}</Text>
											<div className="right">
												<BookmarkIcon newsId={trend.id} newsletterId={trend.id} />
											</div>
										</>
									),
									url: `/articles/detail/${trend.id}`,
								}))}
							/>
						</div>
					)}
				</>
			)}
		</section>
	);
}

/** 'YYYY-MM-DD' → '10월 27일' (못 읽으면 그대로) */
const dayLabel = (date: string) => {
	const [, m, d] = date.match(/^\d{4}-(\d{2})-(\d{2})/) ?? [];
	return m ? `${Number(m)}월 ${Number(d)}일` : date;
};

/** "10월 27일 월요일" (KST) */
const todayLabel = () =>
	new Intl.DateTimeFormat('ko-KR', { month: 'long', day: 'numeric', weekday: 'long', timeZone: 'Asia/Seoul' }).format(
		new Date(),
	);
