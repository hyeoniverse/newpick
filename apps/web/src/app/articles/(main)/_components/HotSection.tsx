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
			<p className="label">{searchParams ? 'TODAY' : 'HOT'}</p>
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
		</StyledHotSection>
	);
}

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

	/* 작은 라벨: 지면의 "오늘의 톱" 표시 */
	.label {
		margin: 0;
		font-size: ${({ theme }) => theme.fontSize.extraSmall};
		font-weight: ${({ theme }) => theme.fontWeight.bold};
		letter-spacing: 0.08em;
		color: ${({ theme }) => theme.color.primary};
	}

	.card-slider {
		/* 점·화살표는 배너 아래 오른쪽 한 줄 */
		.controls {
			display: ${({ $isAll }) => ($isAll ? 'flex' : 'none')};
			justify-content: flex-end;
			margin-top: 0.5rem;
		}
	}

	@media ${({ theme }) => theme.mediaQuery.mobile} {
		flex-wrap: wrap;
	}
`;
