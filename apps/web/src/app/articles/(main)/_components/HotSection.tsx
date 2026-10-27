'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { ArticleSummary as IArticleSummary } from '@/models/article.model';
import { CATEGORIES } from '@/constants/categories';

import { styled } from 'styled-components';
import { LuCoffee, LuCpu, LuGlobe, LuLandmark, LuNewspaper, LuTrendingUp, LuUsers } from 'react-icons/lu';
import Title from '@/components/common/Title';
import Text from '@/components/common/Text';
import CardSlider from '@/components/common/slider/CardSlider';
import BookmarkIcon from '@/components/common/icons/BookmarkIcon';
import { mapIdToTitle } from '@/utils/mapInterests';
import { filterByCategories } from '@/utils/queryNewsletters';
import { isSearching, readFilters, toPageHref } from '@/utils/newsletterSearch';
import SearchFilters from '@/app/articles/(main)/_components/SearchFilters';

/** 분야 페이지 배너 요약 (page.tsx가 서버에서 계산) */
export interface CategoryStats {
	/** 최근 7일 발행 편 수 */
	weekCount: number;
	/** 최근 7일 자주 나온 키워드 */
	keywords: string[];
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
}

export default function HotSection({ trends: initiallData = [], stats }: Props) {
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

	// 전체: 오늘 발행본들의 키워드에서, 분야: 서버가 센 최근 7일 키워드
	const summaryKeywords = isAll ? topKeywords(initiallData) : (stats?.keywords ?? []);

	return (
		<StyledHotSection $isAll={isAll}>
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
							{isAll ? (
								<>
									오늘 <strong>{initiallData.length}개 분야</strong> 발행
								</>
							) : (
								<>
									최근 7일 <strong>{stats?.weekCount ?? 0}편</strong>
								</>
							)}
							{summaryKeywords.length > 0 && (
								// 태블릿 이하에서는 키워드만 아래 줄로 내려 옆으로 넘긴다 (…로 잘리지 않게)
								<span className="keywords">
									<span className="keywords-label">{' · 자주 나온 키워드 '}</span>
									{summaryKeywords.map((k) => (
										<Link key={k} href={toPageHref({ ...filters, keyword: k })} className="keyword">
											#{k}
										</Link>
									))}
								</span>
							)}
						</p>
					</div>
					<hr />
					{/* 화면 폭 전체의 옅은 강조색 띠(::before) 위에 오늘의 톱 카드(흰 카드·그림자)를 올려 한 단계 떠 보이게 */}
					<div className="stage">
						<h2 className="stage-head">
							<span className="label">TODAY</span>
							<Text size="small" color="subText" className="today">
								{todayLabel()} · 오늘의 {isAll ? '톱' : categoryName} 뉴스레터
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
				</>
			)}
		</StyledHotSection>
	);
}

/** 여러 뉴스레터에서 자주 나온 키워드 3개 */
function topKeywords(trends: IArticleSummary[]) {
	const counts = new Map<string, number>();
	for (const t of trends) for (const k of t.keywords ?? []) counts.set(k, (counts.get(k) ?? 0) + 1);
	return [...counts.entries()]
		.sort((a, b) => b[1] - a[1])
		.slice(0, 3)
		.map(([k]) => k);
}

/** "10월 27일 월요일" (KST) */
const todayLabel = () =>
	new Intl.DateTimeFormat('ko-KR', { month: 'long', day: 'numeric', weekday: 'long', timeZone: 'Asia/Seoul' }).format(
		new Date(),
	);

interface StyledProps {
	$isAll?: boolean;
}

const StyledHotSection = styled.section<StyledProps>`
	width: 100%;
	height: fit-content;
	display: flex;
	flex-direction: column;
	justify-content: space-between;
	align-items: flex-start;
	gap: 1rem;
	padding: 1rem 0;

	hr {
		width: 100%;
		border-bottom: 1px solid ${({ theme }) => theme.color.border};
		margin: 0.25rem 0;
		padding: 0;
	}

	/* ② 띠: 헤더 바로 아래부터 배너 아래까지 화면 폭 전체. 아래로 갈수록 페이지 바탕으로 옅어진다.
	   100vw 요소를 쓰면 스크롤바 폭만큼 가로로 넘쳐, 섹션 뒤에 깔리는 ::before로 그린다 */
	position: relative;
	isolation: isolate;
	padding-bottom: 2.5rem;

	&::before {
		content: '';
		position: absolute;
		z-index: -1;
		top: -2.5rem;
		bottom: 0;
		left: 50%;
		width: 100vw;
		transform: translateX(-50%);
		background: linear-gradient(
			180deg,
			color-mix(in srgb, ${({ theme }) => theme.color.primary} 10%, ${({ theme }) => theme.color.background}) 0%,
			color-mix(in srgb, ${({ theme }) => theme.color.primary} 5%, ${({ theme }) => theme.color.background}) 70%,
			${({ theme }) => theme.color.background} 100%
		);
		pointer-events: none;
	}

	.stage {
		width: 100%;
	}

	/* 분야 칩: 지금 분야는 강조색으로 채움 */
	.category-chips {
		display: flex;
		flex-wrap: wrap;
		gap: 0.5rem;

		.chip {
			padding: 0.375rem 0.875rem;
			border: 1px solid ${({ theme }) => theme.color.border};
			border-radius: ${({ theme }) => theme.borderRadius.capsule};
			background: ${({ theme }) => theme.color.background};
			font-size: ${({ theme }) => theme.fontSize.extraSmall};
			font-weight: ${({ theme }) => theme.fontWeight.medium};
			color: ${({ theme }) => theme.color.text};
			transition:
				border-color 0.15s ease,
				color 0.15s ease;

			&:hover {
				border-color: ${({ theme }) => theme.color.primary};
				color: ${({ theme }) => theme.color.primary};
			}

			&[aria-current='page'] {
				border-color: ${({ theme }) => theme.color.primary};
				background: ${({ theme }) => theme.color.primary};
				color: ${({ theme }) => theme.color.background};
			}
		}
	}

	/* 분야 소개: 제목 · 한 줄 설명 · 최근 7일 요약. 오른쪽에 분야 아이콘을 크고 옅게 */
	.intro {
		position: relative;
		width: 100%;
		display: flex;
		flex-direction: column;
		gap: 0.375rem;

		/* 설명·요약은 한 줄로 (넘치면 …), 분야마다 줄 수가 달라 높이가 움직이지 않게 */
		.description,
		.stats {
			overflow: hidden;
			text-overflow: ellipsis;
			white-space: nowrap;
		}

		.stats {
			min-height: 1.5em;
			margin: 0.25rem 0 0;
			font-size: ${({ theme }) => theme.fontSize.small};
			color: ${({ theme }) => theme.color.subText};

			strong {
				color: ${({ theme }) => theme.color.text};
			}

			.keyword {
				margin-left: 0.375rem;
				font-weight: ${({ theme }) => theme.fontWeight.semiBold};
				color: ${({ theme }) => theme.color.primary};
			}
		}

		.watermark {
			position: absolute;
			z-index: -1;
			top: 50%;
			right: 0;
			transform: translateY(-50%);
			line-height: 0;
			color: ${({ theme }) => theme.color.primary};
			opacity: 0.1;
			pointer-events: none;

			svg {
				width: 9rem;
				height: 9rem;
				stroke-width: 1.25;
			}

			@media ${({ theme }) => theme.mediaQuery.mobile} {
				svg {
					width: 5.5rem;
					height: 5.5rem;
				}
			}
		}

		/* 태블릿 이하 배너: 아이콘은 제목 오른쪽 위로 작게(글자와 겹치지 않게), 설명은 두 줄까지, 키워드는 아래 줄에서 옆으로 넘김 */
		@media ${({ theme }) => theme.mediaQuery.tablet} {
			gap: 0.25rem;
			padding-right: 3.25rem;

			h1,
			h2 {
				font-size: 1.75rem;
			}

			.description {
				display: -webkit-box;
				-webkit-box-orient: vertical;
				-webkit-line-clamp: 2;
				/* 분야마다 줄 수가 달라도 높이가 같게 두 줄 자리 */
				min-height: 3em;
				white-space: normal;
				word-break: keep-all;
				font-size: ${({ theme }) => theme.fontSize.small};
				line-height: 1.5;
			}

			.stats {
				overflow: visible;
				white-space: normal;
				margin-right: -3.25rem;
			}

			.keywords {
				display: flex;
				gap: 0.375rem;
				margin-top: 0.375rem;
				overflow-x: auto;
				scrollbar-width: none;

				&::-webkit-scrollbar {
					display: none;
				}
			}

			.keywords-label {
				display: none;
			}

			.keyword {
				flex-shrink: 0;
				margin-left: 0;
				padding: 0.125rem 0.5rem;
				border: 1px solid ${({ theme }) => theme.color.border};
				border-radius: ${({ theme }) => theme.radius.chip};
				background: ${({ theme }) => theme.color.background};
				font-size: ${({ theme }) => theme.fontSize.extraSmall};
			}

			.watermark {
				top: 0.25rem;
				transform: none;

				svg {
					width: 3rem;
					height: 3rem;
				}
			}
		}
	}

	.stage-head {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		margin-bottom: 1rem;
		font-size: inherit;
		font-weight: inherit;
	}

	/* 지면의 "오늘의 톱" 표시: 강조색 칩 */
	.label {
		padding: 0.25rem 0.625rem;
		border-radius: ${({ theme }) => theme.borderRadius.capsule};
		background: ${({ theme }) => theme.color.primary};
		color: ${({ theme }) => theme.color.background};
		font-size: 0.75rem;
		font-weight: ${({ theme }) => theme.fontWeight.bold};
		letter-spacing: 0.08em;
	}

	.card-slider {
		/* 카드 폭은 언제나 한 칸 전체. 슬라이더 기본값(100% - 0.75rem)은 카드가 하나면 늘어나
		   분야 페이지에서만 사진이 커져 높이가 달라졌다 */
		.card {
			flex: 0 0 100%;
			min-width: 100%;
		}

		/* ③ 카드: 띠 위에 뜬 카드. 마우스를 올리면 뜨거나 커지지 않고 테두리·제목 밑줄·"기사 읽기"로 알린다 */
		.card .card-body {
			padding: 1rem;
			border: 1px solid transparent;
			border-radius: ${({ theme }) => theme.borderRadius.medium};
			/* 다크 모드에서는 바탕색 카드가 띠보다 어두워 꺼져 보인다. 글자색을 조금 섞어 띠보다 밝게 */
			background: ${({ theme }) => theme.color.background};
			box-shadow:
				0 1px 2px rgba(0, 0, 0, 0.04),
				0 12px 32px color-mix(in srgb, ${({ theme }) => theme.color.primary} 12%, transparent);
			transition: border-color 0.2s ease;

			:root[data-theme='dark'] & {
				background: color-mix(in srgb, ${({ theme }) => theme.color.text} 9%, ${({ theme }) => theme.color.background});
				box-shadow:
					0 1px 2px rgba(0, 0, 0, 0.4),
					0 12px 32px rgba(0, 0, 0, 0.45);
			}

			@media ${({ theme }) => theme.mediaQuery.mobile} {
				padding: 0.75rem;
			}
		}

		.card .card-body:hover,
		.card .card-body:focus-within {
			border-color: color-mix(in srgb, ${({ theme }) => theme.color.primary} 40%, transparent);
		}

		/* 사진: 아래쪽에 "기사 읽기 →"가 올라온다 (사진은 그대로) */
		.image-placeholder {
			position: relative;
			border-radius: ${({ theme }) => theme.borderRadius.medium};
			overflow: hidden;

			&::after {
				content: '기사 읽기 →';
				position: absolute;
				left: 0.75rem;
				bottom: 0.75rem;
				padding: 0.375rem 0.75rem;
				border-radius: ${({ theme }) => theme.borderRadius.capsule};
				background: rgba(0, 0, 0, 0.65);
				color: #ffffff;
				font-size: ${({ theme }) => theme.fontSize.extraSmall};
				font-weight: ${({ theme }) => theme.fontWeight.semiBold};
				opacity: 0;
				transform: translateY(0.375rem);
				transition:
					opacity 0.2s ease,
					transform 0.2s ease;
			}
		}

		.card .card-body:hover .image-placeholder::after,
		.card .card-body:focus-within .image-placeholder::after {
			opacity: 1;
			transform: translateY(0);
		}

		/* ④ 카드 안. 분야를 바꿔도 카드 높이가 움직이지 않게 줄 수를 고정한다:
		   위 칸 1줄 · 제목 2줄 · 부제 2줄 · 소식 3줄 */
		.card-main {
			padding-right: 0.5rem;

			.category {
				min-height: 1.5em;
				font-size: ${({ theme }) => theme.fontSize.extraSmall};
				letter-spacing: 0.04em;
			}

			/* 제목: 마우스를 올리면 글자 바로 아래에 강조색 밑줄 (두 줄이면 줄마다).
			   높이를 고정해 둔 칸 아래가 아니라 글자를 따라가게 text-decoration으로 */
			.title {
				min-height: calc(2 * 1.35em);
				text-decoration: underline;
				text-decoration-thickness: 2px;
				text-underline-offset: 0.25em;
				text-decoration-color: transparent;
				transition: text-decoration-color 0.25s ease;
			}

			.description {
				min-height: calc(2 * 1.6em);
				margin-bottom: 0.25rem;
				-webkit-line-clamp: 2;
			}

			/* 소식은 항상 3칸 높이 (2개뿐이어도 같은 높이). 칸마다 높이를 정하고 구분선은 칸 안쪽에 그린다 */
			.points ol {
				height: calc(3 * 2.25em);
				overflow: hidden;

				li {
					box-sizing: border-box;
					height: 2.25em;
					align-items: center;
					padding: 0;
				}
			}

			/* 키워드는 한 줄 (개수에 따라 줄 수가 바뀌어 카드 높이가 움직이지 않게) */
			.tags {
				flex-wrap: nowrap;
				overflow: hidden;

				li {
					flex-shrink: 0;
				}
			}

			.card-footer {
				width: 100%;
				margin-top: 0.75rem;
				padding-top: 0.75rem;
				border-top: 1px solid ${({ theme }) => theme.color.border};
				font-size: ${({ theme }) => theme.fontSize.small};
			}
		}

		.card .card-body:hover .title,
		.card .card-body:focus-within .title {
			text-decoration-color: ${({ theme }) => theme.color.primary};
		}

		/* 점·화살표는 띠 아래 오른쪽 한 줄. 분야 페이지(카드 하나)에서도 자리는 남겨 높이를 맞춘다 */
		.controls {
			display: flex;
			justify-content: flex-end;
			margin-top: 0.75rem;
			visibility: ${({ $isAll }) => ($isAll ? 'visible' : 'hidden')};
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.card-slider .card .card-body,
		.card-slider .image-placeholder::after,
		.card-slider .card-main .title {
			transition: none;
		}
	}

	@media ${({ theme }) => theme.mediaQuery.mobile} {
		flex-wrap: wrap;
	}
`;
