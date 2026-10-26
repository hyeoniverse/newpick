'use client';

import { useSearchParams } from 'next/navigation';
import { ArticleSummary as IArticleSummary } from '@/models/article.model';

import { styled } from 'styled-components';
import Title from '@/components/common/Title';
import Text from '@/components/common/Text';
import CardSlider from '@/components/common/slider/CardSlider';
import BookmarkIcon from '@/components/common/icons/BookmarkIcon';
import { mapIdToTitle } from '@/utils/mapInterests';
import { filterByCategories } from '@/utils/queryNewsletters';

interface Props {
	trends?: IArticleSummary[];
}

export default function HotSection({ trends: initiallData = [] }: Props) {
	const searchParams = useSearchParams();
	const categoryId = searchParams.get('categoryId'); // Query Parameter 가져오기
	const categoryName = mapIdToTitle([Number(categoryId)])[0]; // Query Parameter를 카테고리 이름으로 변환
	let filteredTrends = [...initiallData];

	if (categoryName !== '전체') {
		filteredTrends = filterByCategories(initiallData, [categoryName]);
	}

	return (
		<StyledHotSection $isAll={categoryName === '전체'}>
			<Title size="large" weight="semiBold">
				{categoryName} 뉴스레터
			</Title>
			<hr />
			{/* 무대(옅은 강조색 면) 위에 오늘의 톱 카드(흰 카드·그림자)를 올려 한 단계 떠 보이게 */}
			<div className="stage">
				<div className="stage-head">
					<span className="label">{searchParams ? 'TODAY' : 'HOT'}</span>
					<Text size="small" color="subText" className="today">
						{todayLabel()} · 오늘의 톱 뉴스레터
					</Text>
				</div>
				<CardSlider
				className="card-slider"
				type="main"
				data={filteredTrends.map((trend) => ({
					id: trend.id,
					image: trend.image,
					header: trend.categoryName,
					main: {
						title: trend.title,
						// 부제목이 있으면 본문 앞부분 대신 (#42)
						description: trend.subtitle || trend.summary,
						tags: trend.keywords,
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
		</StyledHotSection>
	);
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

	/* ② 무대: 오늘의 톱을 올려 두는 옅은 강조색 면 */
	.stage {
		width: 100%;
		padding: 1.25rem 1.5rem 1rem;
		border-radius: ${({ theme }) => theme.borderRadius.rounded};
		background: linear-gradient(
			180deg,
			color-mix(in srgb, ${({ theme }) => theme.color.primary} 9%, ${({ theme }) => theme.color.background}),
			color-mix(in srgb, ${({ theme }) => theme.color.primary} 3%, ${({ theme }) => theme.color.background})
		);

		@media ${({ theme }) => theme.mediaQuery.mobile} {
			padding: 1rem 0.75rem 0.75rem;
		}
	}

	.stage-head {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		margin-bottom: 1rem;
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
		/* ③ 카드: 무대 위에 뜬 흰 카드. 올리면 살짝 더 뜨고 사진이 조금 커진다 */
		.card .card-body {
			padding: 1rem;
			border-radius: ${({ theme }) => theme.borderRadius.medium};
			/* 다크 모드에서는 바탕색 카드가 무대보다 어두워 꺼져 보인다. 글자색을 조금 섞어 무대보다 밝게 */
			background: ${({ theme }) =>
				theme.name === 'dark'
					? `color-mix(in srgb, ${theme.color.text} 9%, ${theme.color.background})`
					: theme.color.background};
			box-shadow: ${({ theme }) =>
				theme.name === 'dark'
					? '0 1px 2px rgba(0, 0, 0, 0.4), 0 12px 32px rgba(0, 0, 0, 0.45)'
					: `0 1px 2px rgba(0, 0, 0, 0.04), 0 12px 32px color-mix(in srgb, ${theme.color.primary} 12%, transparent)`};
			transition:
				transform 0.25s ease,
				box-shadow 0.25s ease;

			@media ${({ theme }) => theme.mediaQuery.mobile} {
				padding: 0.75rem;
			}
		}

		.card .card-body:hover {
			transform: translateY(-2px);
			box-shadow: ${({ theme }) =>
				theme.name === 'dark'
					? '0 2px 4px rgba(0, 0, 0, 0.45), 0 18px 40px rgba(0, 0, 0, 0.55)'
					: `0 2px 4px rgba(0, 0, 0, 0.05), 0 18px 40px color-mix(in srgb, ${theme.color.primary} 18%, transparent)`};
		}

		.image-placeholder {
			border-radius: ${({ theme }) => theme.borderRadius.medium};
			overflow: hidden;

			img {
				transition: transform 0.4s ease;
			}
		}

		.card .card-body:hover .image-placeholder img {
			transform: scale(1.03);
		}

		/* ④ 카드 안: 분야(작은 강조) → 제목(크게) → 부제(보조) → 선 → 키워드·날짜·조회수·북마크(작게) */
		.card-main {
			padding-right: 0.5rem;

			.category {
				font-size: ${({ theme }) => theme.fontSize.extraSmall};
				letter-spacing: 0.04em;
			}

			.description {
				margin-bottom: 0.25rem;
			}

			.card-footer {
				width: 100%;
				margin-top: 0.75rem;
				padding-top: 0.75rem;
				border-top: 1px solid ${({ theme }) => theme.color.border};
				font-size: ${({ theme }) => theme.fontSize.small};
			}
		}

		/* 점·화살표는 무대 아래 오른쪽 한 줄 */
		.controls {
			display: ${({ $isAll }) => ($isAll ? 'flex' : 'none')};
			justify-content: flex-end;
			margin-top: 0.75rem;
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.card-slider .card .card-body,
		.card-slider .card .card-body:hover,
		.card-slider .card .card-body:hover .image-placeholder img {
			transform: none;
			transition: none;
		}
	}

	@media ${({ theme }) => theme.mediaQuery.mobile} {
		flex-wrap: wrap;
	}
`;
