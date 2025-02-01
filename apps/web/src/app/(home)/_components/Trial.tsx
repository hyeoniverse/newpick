import { useState } from 'react';
import Image from 'next/image';
import parse from 'html-react-parser';
import DOMPurify from 'dompurify';
import { summarizeNews } from '@/api/ai';
import { dateFormatter } from '@/utils/formatter';

import styled from 'styled-components';
import { GiNothingToSay } from 'react-icons/gi';
import { BiSolidMessageRoundedError } from 'react-icons/bi';
import Button from '@/components/common/Button';
import Title from '@/components/common/Title';
import Text from '@/components/common/Text';
import Skeleton from '@/components/common/loader/Skeleton';

interface Newsletter {
	catergoryId: number;
	title: string;
	date: string;
	mainImage: string;
	contentAsHTML: string;
	relatedNews: string;
}

export default function Trial() {
	const [newsletter, setNewsletter] = useState<Newsletter | null>(null);
	const [isLoading, setIsLoading] = useState(false);
	const [errorMessage, setErrorMessage] = useState<string | null>(null);

	const handleGenerateNewsletter = async () => {
		setIsLoading(true);
		setNewsletter(null);
		setErrorMessage(null);

		const yesterday = dateFormatter(
			new Date(new Date().setDate(new Date().getDate() - 1)).toISOString().split('T')[0]
		);

		try {
			const result = await summarizeNews(2, yesterday);

			if (!result || !result.newsletter) {
				throw new Error('올바른 뉴스 요약 데이터가 없습니다.');
			}

			// `contentAsHTML`에서 ` ```html ` 코드 블록 제거
			const cleandTitle = cleanString(result.newsletter.title);
			const cleanedHtml = cleanString(result.newsletter.contentAsHTML);

			const newsletter: Newsletter = {
				catergoryId: result.newsletter.categoryId,
				date: yesterday,
				title: cleandTitle,
				contentAsHTML: cleanedHtml,
				mainImage: getMainUrl(result.newsletter.imageUrl),
				relatedNews: getMainUrl(result.newsletter.usedNews),
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
		return urls.length > 0 ? urls[0] : 'https://via.placeholder.com/860';
	};

	const sanitizeHtml = (html: string) => {
		return DOMPurify.sanitize(html, { USE_PROFILES: { html: true } });
	};

	return (
		<StyledTrial>
			<Title size="large" weight="semiBold" color="primary">
				{newsletter ? newsletter.title : 'AI 뉴스레터 체험하기'}
			</Title>

			<StyledContent>
				{isLoading ? (
					<Skeleton />
				) : errorMessage ? (
					<div className="info">
						<BiSolidMessageRoundedError />
						<Text size="large">{errorMessage}</Text>
					</div>
				) : newsletter ? (
					<>
						<Text size="small" color="subText" className="date">
							{dateFormatter(newsletter.date)}
						</Text>
						<Image width={860} height={484} src={newsletter.mainImage} alt={newsletter.title} />
						{parse(sanitizeHtml(newsletter.contentAsHTML))}
					</>
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
	height: 60vh;
	min-width: ${({ theme }) => theme.layout.width.small};
	max-width: ${({ theme }) => theme.layout.width.large};
	display: flex;
	flex-direction: column;
	justify-content: flex-start;
	align-items: center;
	padding: 1rem;
	gap: 1.5rem;
`;

const StyledContent = styled.div`
	width: 100%;
	height: 100%;
	display: flex;
	flex-direction: column;
	justify-content: flex-start;
	align-items: flex-start;
	padding: 0.5rem 2rem;

	line-height: 1.6;
	font-size: 1rem;
	color: ${({ theme }) => theme.color.text};
	overflow-y: scroll;

	background-color: ${({ theme }) => theme.color.surface};
	border: 1px solid ${({ theme }) => theme.color.border};
	border-radius: ${({ theme }) => theme.borderRadius.soft};

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

	.date {
		width: 100%;
		display: flex;
		justify-content: flex-end;
		text-decoration: underline;
	}

	.image-placeholder {
		width: 100%;
		aspect-ratio: 16 / 9;
		overflow: hidden;
		border-radius: ${({ theme }) => theme.borderRadius.medium};
		background: ${({ theme }) => theme.color.surface};
	}

	h1,
	h2,
	h3 {
		font-weight: bold;
		margin-top: 1rem;
	}

	p {
		margin-bottom: 0.75rem;
	}

	ul,
	ol {
		padding-left: 1.5rem;
		margin-bottom: 1rem;
	}

	img {
		max-width: 100%;
		border-radius: ${({ theme }) => theme.borderRadius.soft};
		margin: 1rem 0;
	}

	blockquote {
		border-left: 4px solid ${({ theme }) => theme.color.primary};
		padding-left: 1rem;
		color: ${({ theme }) => theme.color.secondary};
		font-style: italic;
	}
`;
