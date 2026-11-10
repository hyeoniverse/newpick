'use client';

import { ROUTES } from '@/constants/routes';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { Suspense, useEffect, useState } from 'react';
import { dateFormatter } from '@/utils/formatter';
import { mapIdToTitle } from '@/utils/mapInterests';

import Text from '@/components/common/Text';
import SummaryTextBox from '@/components/common/article/SummaryTextBox';
import PopularArticle from '@/app/articles/detail/[slug]/_components/PopularArticle';
import ArticleContent from '@/app/articles/detail/[slug]/_components/content/ArticleContent';
import PrevNextArticle from '@/app/articles/detail/[slug]/_components/PrevNextArticle';
import LatestArticle from '@/app/articles/detail/[slug]/_components/LatestArticle';
import MobileLikeLinkButton from '@/app/articles/detail/[slug]/_components/MobileLikeLinkButton';
import BackBar from '@/components/common/BackBar';
import BookmarkIcon from '@/components/common/icons/BookmarkIcon';
import LinkCopyIcon from '@/components/common/icons/LinkCopyIcon';
import Title from '@/components/common/Title';
import Tags from '@/components/common/Tags';
import { useArticleContentQuery } from '@/hooks/useArticle';
import { useViewCount } from '@/hooks/useViewCount';
import { ArticleInfo as IArticleInfo } from '@/types/article';
import { stripCodeFence } from '@/utils/stripCodeFence';
import { DEFAULT_IMAGES } from '@/constants/images';
import { parseUrls, extractStories } from '@/utils/parseArticles';
import Skeleton from '@/components/common/loader/Skeleton';
import ErrorState from '@/components/common/ErrorState';
import { DELETED_NEWSLETTER, errorStateFor, statusOf } from '@/constants/errors';
import { cx } from '@/styles/tw';

interface Props {
	/** 서버에서 읽어 둔 뉴스레터. 있으면 불러오는 동안의 빈 화면 없이 바로 그린다 */
	initial?: IArticleInfo;
}

function Article({ initial }: Props) {
	const router = useRouter();
	const { slug } = useParams() as { slug: string };

	const { data: articleContent, error, refetch } = useArticleContentQuery(slug, initial);
	const increasedViewCount = useViewCount(Number(slug));
	// 제목이 화면 위로 지나가면 '목록으로' 옆에 제목을 한 줄로 띄운다
	const [titleEl, setTitleEl] = useState<HTMLElement | null>(null);
	const [titlePassed, setTitlePassed] = useState(false);

	useEffect(() => {
		if (!titleEl) return;
		const observer = new IntersectionObserver(([entry]) =>
			setTitlePassed(!entry.isIntersecting && entry.boundingClientRect.top < 0),
		);
		observer.observe(titleEl);
		return () => observer.disconnect();
	}, [titleEl]);

	// 서버 확인 뒤에 지워졌거나(404) 서버 오류면 빈 화면 대신 안내
	if (error) {
		const status = statusOf(error);
		return status === 404 ? (
			<ErrorState code={404} {...DELETED_NEWSLETTER} />
		) : (
			<ErrorState code={status} {...errorStateFor(status)} onRetry={() => refetch()} />
		);
	}

	if (!articleContent) {
		return null;
	}
	const newsletterHTML = stripCodeFence(articleContent.newsletter.contentAsHTML, 'html');
	const newsletterContent = articleContent.newsletter;
	const relatedNews = parseUrls(articleContent.newsletter.usedNews);

	return (
		<>
			{/* 목록으로: 스크롤해도 따라온다. 헤더처럼 내릴 땐 화살표만 남기고 접고, 올릴 땐 펼친다.
          제목을 지나 읽는 중이면 옆에 제목을 한 줄로, 누르면 맨 위 제목으로 올라간다 */}
			<ArticleBackBar
				text="목록으로"
				onClick={() => router.push(ROUTES.articlesByCategory(newsletterContent.categoryId))}
				title={newsletterContent.title}
				showTitle={titlePassed}
				// 따라오는 제목을 누르면 맨 위 제목으로 (움직임 줄이기 설정이면 바로)
				onTitleClick={() =>
					window.scrollTo({
						top: 0,
						behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth',
					})
				}
			/>
			<div className="np-articles-article-title-section" data-track-section="detail-title">
				<div className="title-section">
					<Link href={ROUTES.articlesByCategory(newsletterContent.categoryId)} className="category">
						{mapIdToTitle([newsletterContent.categoryId])[0] || `#${newsletterContent.categoryId}`}
					</Link>
					<Title size="large" weight="semiBold" className="title" ref={setTitleEl}>
						{newsletterContent.title}
					</Title>
					{newsletterContent.subtitle && (
						<Text size="medium" color="subText" className="subtitle">
							{newsletterContent.subtitle}
						</Text>
					)}
					<Tags tags={newsletterContent.keywords} className="keywords" linkable />
					<div className="info">
						<Text size="small" color="subText">
							{dateFormatter(newsletterContent.createdAt)}
						</Text>
						<Text size="small" color="subText">
							|&nbsp;&nbsp;조회수 {increasedViewCount ?? newsletterContent.viewcount}
						</Text>
					</div>
					<div className="icons">
						<BookmarkIcon newsId={newsletterContent.id} newsletterId={newsletterContent.id} />
						<LinkCopyIcon id={newsletterContent.id} />
					</div>
				</div>
			</div>
			<div className="np-articles-article-article">
				<Suspense fallback={<Skeleton />}>
					<SummaryTextBox stories={extractStories(newsletterHTML)}>{newsletterContent.content}</SummaryTextBox>
				</Suspense>
				{/* 생성형 AI 결과물 표시 (인공지능 기본법 제31조, 이용약관 제5조) */}
				<Text as="p" size="extraSmall" color="subText" className="ai-notice">
					이 뉴스레터는 AI가 여러 언론사 기사를 요약·재구성했습니다. 수치·발언은 각 소식의 출처 기사를 함께 확인하세요.
				</Text>
				<div className="content-section">
					<Suspense fallback={<Skeleton />}>
						<ArticleContent
							className="content"
							content={newsletterHTML}
							newsId={newsletterContent.id}
							articleImage={newsletterContent.imageUrl ?? `${DEFAULT_IMAGES.MONO}`}
							related={relatedNews}
						/>
					</Suspense>
					<Suspense fallback={<Skeleton />}>
						<PopularArticle className="popular" />
					</Suspense>
				</div>
				<Suspense fallback={<Skeleton />}>
					<PrevNextArticle
						className="prev-next"
						prev={articleContent.previousNewsletter}
						next={articleContent.nextNewsletter}
					/>
				</Suspense>
				<Suspense fallback={<Skeleton />}>
					<LatestArticle className="latest" />
				</Suspense>
				<MobileLikeLinkButton className="icons" newsId={newsletterContent.id} />
			</div>
		</>
	);
}

/** 기사 화면에서는 제목 위 여백을 두고 시작 (styles/pages/articles.css) */
const ArticleBackBar = ({ className, ...props }: React.ComponentProps<typeof BackBar>) => (
	<BackBar className={cx('np-articles-article-back-bar', className)} {...props} />
);

export default Article;
