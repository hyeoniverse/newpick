import { useState } from 'react';
import parse from 'html-react-parser';
import DOMPurify from 'dompurify';

import { DEFAULT_IMAGES } from '@/constants/images';
import { ArticleDetail as IArticleDetail } from '@/models/article.model';
import { dateFormatter } from '@/utils/formatter';
import { mapTitleToId } from '@/utils/mapInterests';
import { parseUrls } from '@/utils/parseArticles';
import { summarizeNews } from '@/api/ai';
import { useSingleSelectInterest } from '@/hooks/useInterests';

import styled from 'styled-components';
import { GiNothingToSay } from 'react-icons/gi';
import { BiSolidMessageRoundedError } from 'react-icons/bi';
import Button from '@/components/common/Button';
import Title from '@/components/common/Title';
import Text from '@/components/common/Text';
import Imgae from '@/components/common/Image';
import Skeleton from '@/components/common/loader/Skeleton';
import OpenGraphCard from '@/components/common/article/OpenGraphCard';
import SubscribeInduce from '@/components/common/article/SubscribeInduce';
import CategoryTags from '@/components/common/article/CategoryTags';

export default function Trial() {
	const [newsletter, setNewsletter] = useState<IArticleDetail | null>(null);
	const [isLoading, setIsLoading] = useState(false);
	const [errorMessage, setErrorMessage] = useState<string | null>(null);
	const { selectedInterest = 'IT' } = useSingleSelectInterest();

	const getStartDate = () => {
		const now = new Date();
		const hours = now.getHours();
		// 현재 시간이 오전 8시 이전이면 어제 날짜, 이후면 오늘 날짜 사용
		const targetDate = hours < 8 ? new Date(now.setDate(now.getDate() - 1)) : now;
		return dateFormatter(targetDate.toISOString().split('T')[0]);
	};

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
			const cleandTitle = cleanString(result.newsletter.title);
			const cleanedHtml = cleanString(result.newsletter.contentAsHTML);

			const newsletter: IArticleDetail = {
				...result.newsletter,
				title: cleandTitle,
				categoryId: result.newsletter.categoryId,
				createdAt: startDate,
				contentAsHTML: cleanedHtml,
				imageUrl: getMainUrl(result.newsletter.imageUrl),
				usedNews: result.newsletter.usedNews,
			};

			setNewsletter(newsletter);
		} catch (error) {
			console.error('뉴스 요약 실패:', error);
			setErrorMessage('뉴스 요약을 가져오는 데 실패했습니다.');
		} finally {
			setIsLoading(false);
		}
	};

	const cleanString = (text: string) => {
		if (!text) return '';

		// ` ```html ` 코드 블록 제거
		let cleanedText = text
			.replace(/^```html\s*/, '')
			.replace(/```$/, '')
			.trim();

		// 최상위 `<div>` 태그 제거
		cleanedText = cleanedText
			.replace(/^<div[^>]*>/, '')
			.replace(/<\/div>$/, '')
			.trim();

		cleanedText = cleanedText.replace(/^"(.*)"$/, '$1');

		return cleanedText;
	};

	const getMainUrl = (urlData: string) => {
		// ','로 분할 후 빈 값(`""`) 제거
		const urls = urlData.split(',').filter((url) => url.trim() !== '');

		// 첫 번째 유효한 이미지 반환 (없으면 기본 이미지)
		return urls.length > 0 ? urls[0] : DEFAULT_IMAGES.MONO;
	};

	const sanitizeHtml = (html: string) => {
		return DOMPurify.sanitize(html, { USE_PROFILES: { html: true } });
	};

	return (
		<StyledTrial>
			<div className="header">
				<Text size="medium">생성하고 싶은 AI 뉴스레터의 관심사를 선택해주세요.</Text>
				<CategoryTags select="single" />
			</div>
			<StyledContent>
				{isLoading ? (
					<Skeleton />
				) : errorMessage ? (
					<div className="info">
						<BiSolidMessageRoundedError />
						<Text size="large">{errorMessage}</Text>
					</div>
				) : newsletter ? (
					<div className="content">
						<div className="article-header">
							<Title size="large" weight="semiBold" color="primary">
								{newsletter ? newsletter.title : 'AI 뉴스레터 체험하기'}
							</Title>
							<Text size="small" color="subText" className="date">
								{dateFormatter(newsletter.createdAt)}
							</Text>
							<hr />
						</div>
						<div className="newsletter">
							<div className="image-placeholder">
								<Imgae src={newsletter.imageUrl || DEFAULT_IMAGES.MONO} alt={newsletter.title} />
							</div>
							<StyledArticle>
								<div className="body">{parse(sanitizeHtml(newsletter.contentAsHTML))}</div>
							</StyledArticle>
						</div>
						<div className="action">
							<OpenGraphCard urls={parseUrls(newsletter.usedNews)} />
							<SubscribeInduce />
						</div>
					</div>
				) : (
					<div className="info">
						<GiNothingToSay />
						<Text size="large">아직 데이터가 없습니다.</Text>
					</div>
				)}
			</StyledContent>
			<Button size="medium" scheme="primary" onClick={handleGenerateNewsletter} disabled={isLoading}>
				{newsletter || errorMessage ? '다시 하기' : '생성하기'}
			</Button>
		</StyledTrial>
	);
}

const StyledTrial = styled.div`
	width: 80vw;
	height: 80vh;
	max-width: ${({ theme }) => theme.layout.width.large};

	display: flex;
	flex-direction: column;
	justify-content: flex-start;
	align-items: center;
	gap: 1.5rem;
	overflow: hidden;

	.header {
		width: 100%;
		display: flex;
		flex-direction: column;
		gap: 1rem;
		padding: 0rem 0.5rem;

		span {
			padding: 0 0.25rem;
		}
	}
`;

const StyledContent = styled.div`
	width: 100%;
	height: 100%;
	display: flex;
	flex-direction: column;
	justify-content: flex-start;
	align-items: center;
	padding: 1.5rem 2rem;
	gap: 1rem;
	overflow-y: scroll;

	border: 1px solid ${({ theme }) => theme.color.border};
	border-radius: ${({ theme }) => theme.borderRadius.soft};

	.article-header {
		.date {
			width: 100%;
			display: flex;
			justify-content: flex-end;
			text-decoration: underline;
			margin: 1rem 0;
		}

		hr {
			width: 100%;
			margin-bottom: 2rem;
			padding: 0;
			border: none;
			border-bottom: 1px solid ${({ theme }) => theme.color.border};
		}
	}

	.info {
		width: 100%;
		height: 100%;
		display: flex;
		flex-direction: column;
		justify-content: center;
		align-items: center;
		gap: 1rem;

		svg {
			font-size: 3rem;
			color: ${({ theme }) => theme.color.secondary};
		}
	}

	.newsletter {
		width: 100%;
		height: fit-content;
		display: flex;
		flex-direction: column;
		justify-content: flex-start;
		align-items: flex-start;
	}

	.action {
		width: 100%;
		height: fit-content;
		display: flex;
		flex-direction: column;
		padding: 2rem 0;
	}

	.image-placeholder {
		width: 100%;
		display: flex;
		justify-content: center;
		align-items: center;

		img {
			width: 100%;
			height: auto;
			border-radius: ${({ theme }) => theme.borderRadius.soft};
		}
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
		h3 {
			margin-top: 1.5rem;
			margin-bottom: 0.25rem;
			font-size: ${({ theme }) => theme.fontSize.extraLarge};
			font-weight: ${({ theme }) => theme.fontWeight.semiBold};
		}

		p,
		span {
			line-height: 1.6;
			margin-bottom: 0.5rem;
			font-size: ${({ theme }) => theme.fontSize.small};
		}

		strong {
			color: ${({ theme }) => theme.color.primary};
			background: ${({ theme }) => theme.color.tertiary};
			padding: 0.15rem 0.25rem;
		}
	}
`;
