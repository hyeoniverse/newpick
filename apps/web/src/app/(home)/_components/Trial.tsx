import { useState } from 'react';
import parse from 'html-react-parser';
import { sanitizeHtml } from '@/utils/sanitizeHtml';

import { DEFAULT_IMAGES } from '@/constants/images';
import { ArticleDetail as IArticleDetail } from '@/models/article.model';
import { dateFormatter, kstDate } from '@/utils/formatter';
import { mapIdToTitle, mapTitleToId } from '@/utils/mapInterests';
import { parseUrls } from '@/utils/parseArticles';
import { summarizeNews } from '@/api/ai';

import styled from 'styled-components';
import { LuSparkles, LuCircleAlert } from 'react-icons/lu';
import Button from '@/components/common/Button';
import Title from '@/components/common/Title';
import Text from '@/components/common/Text';
import Imgae from '@/components/common/Image';
import Skeleton from '@/components/common/loader/Skeleton';
import OpenGraphCard from '@/components/common/article/OpenGraphCard';
import SubscribeInduce from '@/components/common/article/SubscribeInduce';
import CategoryTags from '@/components/common/article/CategoryTags';
import { getFirstImage } from '@/utils/getFirstImage';
import { stripCodeFence } from '@/utils/stripCodeFence';

export default function Trial() {
	const [newsletter, setNewsletter] = useState<IArticleDetail | null>(null);
	const [isLoading, setIsLoading] = useState(false);
	const [errorMessage, setErrorMessage] = useState<string | null>(null);
	const [selectedInterest, setSelectedInterest] = useState<string>('IT'); // 전역 상태 제거

	// 크롤링은 매일 08:00(KST)에 돌아서, 그 전에는 오늘 뉴스가 없습니다. 항상 하루치가 있는 어제를 요약합니다.
	const getStartDate = () => kstDate(1);

	const handleGenerateNewsletter = async () => {
		setIsLoading(true);
		setNewsletter(null);
		setErrorMessage(null);

		const category = mapTitleToId([selectedInterest]);
		const startDate = getStartDate();

		try {
			const result = await summarizeNews(category[0], startDate);

			if (!result || !result.newsletter) {
				throw new Error('올바른 뉴스 요약 데이터가 없습니다.');
			}

			// `contentAsHTML`에서 ` ```html ` 코드 블록 제거
			const cleanedHtml = stripCodeFence(result.newsletter.html, 'html');
			const newsletter: IArticleDetail = {
				// 체험 결과는 저장되지 않으므로 id·조회수가 없습니다.
				id: 0,
				viewcount: 0,
				content: result.newsletter.content ?? '',
				title: result.newsletter.title,
				categoryId: result.newsletter.categoryId,
				createdAt: startDate,
				contentAsHTML: cleanedHtml || '',
				imageUrl: getFirstImage(result.newsletter.imageUrl || ''),
				usedNews: result.newsletter.newslinks || '',
			};

			setNewsletter(newsletter);
		} catch {
			setErrorMessage('뉴스 요약을 가져오는 데 실패했습니다.');
		} finally {
			setIsLoading(false);
		}
	};

	return (
		<StyledTrial>
			<div className="header">
				<Title size="small" weight="bold">
					AI 뉴스레터 체험하기
				</Title>
				<Text size="small" color="subText">
					분야를 고르면 어제 뉴스로 AI가 뉴스레터를 만들어 드려요. 저장되지 않는 체험판이에요.
				</Text>
				<CategoryTags selectType="localSingle" onSelect={setSelectedInterest} selected={selectedInterest} />
			</div>
			<StyledContent aria-live="polite" aria-busy={isLoading}>
				{isLoading ? (
					<div className="loading">
						<Text size="small" color="subText">
							AI가 {selectedInterest} 분야의 주요 소식을 고르고 쓰는 중이에요. 30초쯤 걸려요.
						</Text>
						<Skeleton />
					</div>
				) : errorMessage ? (
					<div className="info">
						<span className="badge error">
							<LuCircleAlert />
						</span>
						<Text size="medium" weight="semiBold">
							{errorMessage}
						</Text>
						<Text size="small" color="subText">
							잠시 뒤 다시 시도해 주세요.
						</Text>
					</div>
				) : newsletter ? (
					<div className="content">
						<div className="article-header">
							{newsletter.categoryId && <span className="tag">{mapIdToTitle([newsletter.categoryId])[0]}</span>}
							<Title size="large" weight="bold" className="title">
								{newsletter.title}
							</Title>
							<Text size="small" color="subText">
								{dateFormatter(newsletter.createdAt)} 뉴스 기준
							</Text>
						</div>
						{newsletter.imageUrl && (
							<div className="image-placeholder">
								<Imgae src={newsletter.imageUrl || DEFAULT_IMAGES.MONO} alt={newsletter.title} />
							</div>
						)}
						<StyledArticle>
							<div className="body">{parse(sanitizeHtml(newsletter.contentAsHTML))}</div>
						</StyledArticle>
						<div className="action">
							{newsletter.usedNews != '' && <OpenGraphCard urls={parseUrls(newsletter.usedNews)} />}
							<SubscribeInduce />
						</div>
					</div>
				) : (
					<div className="info">
						<span className="badge">
							<LuSparkles />
						</span>
						<Text size="medium" weight="semiBold">
							분야를 고르고 생성하기를 눌러 보세요
						</Text>
						<Text size="small" color="subText">
							매일 아침 구독자에게 가는 뉴스레터와 같은 방식으로 만들어요.
						</Text>
					</div>
				)}
			</StyledContent>
			<Button
				size="medium"
				scheme="primary"
				className="generate"
				onClick={handleGenerateNewsletter}
				disabled={isLoading}
			>
				{isLoading
					? '만드는 중…'
					: newsletter || errorMessage
						? '다시 만들기'
						: `${selectedInterest} 뉴스레터 생성하기`}
			</Button>
		</StyledTrial>
	);
}

const StyledTrial = styled.div`
	/* 대화상자 안쪽 여백(--modal-pad)을 뺀 만큼 넓게 */
	width: min(52rem, calc(100vw - 2rem - 2 * var(--modal-pad, 1.75rem)));
	height: min(46rem, calc(100vh - 2rem - 2 * var(--modal-pad, 1.75rem)));
	display: flex;
	flex-direction: column;
	gap: 1.25rem;

	.header {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
		padding-right: 2.5rem; /* 닫기 버튼 자리 */

		> ul,
		> div:last-child {
			margin-top: 0.5rem;
		}
	}

	.generate {
		flex-shrink: 0;
		width: 100%;
		height: 3rem;
		border-radius: ${({ theme }) => theme.borderRadius.medium};
	}
`;

const StyledContent = styled.div`
	flex: 1;
	min-height: 0;
	overflow-y: auto;
	padding: 1.5rem;
	border-radius: ${({ theme }) => theme.borderRadius.rounded};
	background: ${({ theme }) => theme.color.surface};

	@media ${({ theme }) => theme.mediaQuery.mobile} {
		padding: 1rem;
	}

	/* 빈 상태·실패 */
	.info {
		height: 100%;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: 0.5rem;
		text-align: center;
		word-break: keep-all;

		.badge {
			display: flex;
			align-items: center;
			justify-content: center;
			width: 3.5rem;
			height: 3.5rem;
			margin-bottom: 0.5rem;
			border-radius: ${({ theme }) => theme.borderRadius.circle};
			background: ${({ theme }) => theme.color.tertiary};
			color: ${({ theme }) => theme.color.primary};

			svg {
				width: 1.75rem;
				height: 1.75rem;
			}

			&.error {
				color: ${({ theme }) => theme.color.error};
			}
		}
	}

	.loading {
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}

	/* 결과 */
	.content {
		display: flex;
		flex-direction: column;
		gap: 1.5rem;
		padding: 0.5rem;
	}

	.article-header {
		display: flex;
		flex-direction: column;
		align-items: flex-start;
		gap: 0.5rem;
		padding-bottom: 1.25rem;
		border-bottom: 1px solid ${({ theme }) => theme.color.border};

		.tag {
			padding: 0.125rem 0.625rem;
			border-radius: ${({ theme }) => theme.borderRadius.capsule};
			background: ${({ theme }) => theme.color.tertiary};
			color: ${({ theme }) => theme.color.primary};
			font-size: ${({ theme }) => theme.fontSize.extraSmall};
			font-weight: ${({ theme }) => theme.fontWeight.semiBold};
		}

		.title {
			word-break: keep-all;
		}
	}

	.image-placeholder img {
		width: 100%;
		height: auto;
		border-radius: ${({ theme }) => theme.borderRadius.medium};
	}

	.action {
		display: flex;
		flex-direction: column;
		gap: 1.5rem;
	}
`;

const StyledArticle = styled.div`
	width: 100%;
	height: fit-content;
	display: flex;
	flex-direction: column;
	justify-content: flex-start;
	align-items: center;
	gap: 1rem;
	line-height: 1.6;
	white-space: no-wrap;

	.body {
		width: 100%;

		h1,
		h2,
		h3,
		h4 {
			font-size: ${({ theme }) => theme.fontSize.extraLarge};
			font-weight: ${({ theme }) => theme.fontWeight.semiBold};
		}

		p,
		span {
			line-height: 1.8;
			font-size: ${({ theme }) => theme.fontSize.small};
		}

		strong {
			color: ${({ theme }) => theme.color.primary};
			background: ${({ theme }) => theme.color.tertiary};
			padding: 0.15rem 0.25rem;
		}
	}
`;
