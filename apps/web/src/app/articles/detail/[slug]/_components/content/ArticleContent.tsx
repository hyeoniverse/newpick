'use client';

import { useRef } from 'react';
import SubscribeInduce from '@/components/common/article/SubscribeInduce';
import HeightAutoImg from '@/components/common/HeightAutoImg';
import OpenGraphCard from '@/components/common/article/OpenGraphCard';
import { sanitizeHtml } from '@/utils/sanitizeHtml';
import { linkDebateSources } from '@/utils/debateSources';
import HighlightLayer from './HighlightLayer';
import FollowLayer from './FollowLayer';
import { cx } from '@/styles/tw';

interface NewsletterContentProps {
	content: string;
	flex?: number;
	className?: string;
	articleImage?: string;
	newsId?: number;
	related?: string[];
}

function ArticleContent({ content, className, articleImage, newsId, related = [] }: NewsletterContentProps) {
	const bodyRef = useRef<HTMLDivElement>(null);
	return (
		<div className={cx('np-articles-article-content-container', className)}>
			{articleImage && (
				<div className="image-wrapper" data-track-section="detail-image">
					<HeightAutoImg src={articleImage} height={'auto'} />
				</div>
			)}
			<article className="np-articles-article-content-newsletter-content">
				{/* 방문 통계 (#131): 본문의 브리핑 · 소식을 구역으로 센다 */}
				<div
					ref={bodyRef}
					data-track-content
					dangerouslySetInnerHTML={{ __html: sanitizeHtml(linkDebateSources(content)) }}
				/>
				{/* 스크랩 · 메모 (#123): 뉴스레터 상세에서만 (관리자 미리보기 등은 newsId 없음) */}
				{newsId && <HighlightLayer newsletterId={newsId} rootRef={bodyRef} />}
				{/* 후속 지켜보기: 소식마다 단추 */}
				{newsId && <FollowLayer newsletterId={newsId} rootRef={bodyRef} content={content} />}
				<div className="content-bottom-margin" />
			</article>
			{/* 본문을 다 읽은 자리에서 바로 구독 권유, 그 아래 출처(관련 뉴스) */}
			<SubscribeInduce className="subscribe" />
			<div className="np-articles-article-content-open-graph-card-container" data-track-section="detail-sources">
				<OpenGraphCard urls={related} />
			</div>
		</div>
	);
}

export default ArticleContent;
