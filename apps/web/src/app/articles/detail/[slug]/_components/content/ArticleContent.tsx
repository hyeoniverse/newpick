'use client';

import { useMemo, useRef, useState } from 'react';
import ImageViewer, { type ViewerImage } from '@/components/common/ImageViewer';
import SubscribeInduce from '@/components/common/article/SubscribeInduce';
import HeightAutoImg from '@/components/common/HeightAutoImg';
import OpenGraphCard from './OpenGraphCard';
import CoverMosaic, { coverPhotos } from './CoverMosaic';
import { sanitizeHtml } from '@/utils/sanitizeHtml';
import { linkDebateSources } from '@/utils/debateSources';
import HighlightLayer from './HighlightLayer';
import FollowLayer from './FollowLayer';
import { cx } from '@/styles/tw';
import imageLoader from '@/utils/imageLoader';

/** 크게 볼 수 있는 본문 사진: 소식 사진 (#49). 맨 위 대표 사진은 이 사진들의 모자이크 (CoverMosaic), 소식 사진이 없는 글만 예전 대표 사진 한 장 */
const STORY_IMAGE = '.story-image img';

/**
 * 소식 사진을 누를 수 있는 단추로 (role · tabindex · 이름 '… 크게 보기'). 정리(sanitize)한 뒤에 붙여, 서버가 그린 첫 HTML부터 들어간다.
 * alt 값은 정리기가 이미 이스케이프한 그대로 쓴다
 */
export function zoomableImages(html: string) {
	return html.replace(
		/(<figure class="story-image"[^>]*>\s*<img\b)([^>]*?)\balt="([^"]*)"/g,
		(_, start: string, before: string, alt: string) =>
			`${start}${before}alt="${alt}" role="button" tabindex="0" aria-label="${alt || '사진'} 크게 보기"`,
	);
}

/**
 * 대표 사진은 칸 폭에 맞춰 줄인 사진(api /images, next/image)이라 휴대폰에서는 작다. 뷰어에는 같은 사진을 큰 폭(1200)으로.
 * 줄인 사진이 아니면(받지 못해 대신 보인 사진 등) 보이는 그대로
 */
function largeCover(img: HTMLImageElement) {
	const shown = img.currentSrc || img.src;
	try {
		const original = new URL(shown).searchParams.get('url');
		return original ? imageLoader({ src: original, width: 1200 }) : shown;
	} catch {
		return shown;
	}
}

interface NewsletterContentProps {
	content: string;
	flex?: number;
	className?: string;
	articleImage?: string;
	/** 대표 사진이 깨질 때 대신 보일 사진 */
	fallbackImage?: string | null;
	newsId?: number;
	related?: string[];
}

function ArticleContent({
	content,
	className,
	articleImage,
	fallbackImage,
	newsId,
	related = [],
}: NewsletterContentProps) {
	const bodyRef = useRef<HTMLDivElement>(null);
	const [viewing, setViewing] = useState<ViewerImage | null>(null);
	// 본문 HTML은 내용이 바뀔 때만 새로 만든다: 사진 보기를 열고 닫을 때마다 본문이 통째로 다시 그려져 사진 요소 · 스크랩 표시가 바뀌었다
	const { html, photos } = useMemo(() => {
		const clean = sanitizeHtml(linkDebateSources(content));
		return { html: { __html: zoomableImages(clean) }, photos: coverPhotos(clean) };
	}, [content]);

	// 소식 사진은 틀(16:9)에 맞춰 잘려 보여, 누르면(키보드 Enter · Space도) 잘리지 않은 전체를 크게 본다 (zoomableImages)
	const openImage = (target: EventTarget) => {
		const img = (target as HTMLElement).closest?.<HTMLImageElement>(STORY_IMAGE);
		if (!img) return false;
		const caption = img.closest('figure')?.querySelector('figcaption');
		const link = caption?.querySelector('a');
		setViewing({
			src: img.currentSrc || img.src,
			alt: img.alt,
			caption: caption?.textContent
				? link?.textContent
					? {
							label: caption.textContent.replace(link.textContent, '').trim() || undefined,
							source: link.textContent.trim(),
							href: link.href,
						}
					: { source: caption.textContent.trim() }
				: undefined,
			from: img,
		});
		return true;
	};

	return (
		<div className={cx('np-articles-article-content-container', className)}>
			{photos.length > 0 ? (
				<div className="image-wrapper" data-track-section="detail-image">
					<CoverMosaic
						photos={photos}
						onOpen={(photo, img) => setViewing({ src: photo.src, alt: photo.alt, caption: photo.caption, from: img })}
					/>
				</div>
			) : (
				articleImage && (
					<div className="image-wrapper" data-track-section="detail-image">
						{/* 대표 사진도 누르면 같은 뷰어로 크게 (화면이 좁으면 작게 보여서) */}
						<button
							type="button"
							aria-label="대표 사진 크게 보기"
							className="block w-full cursor-zoom-in border-0 bg-transparent p-0"
							onClick={(e) => {
								const img = e.currentTarget.querySelector('img');
								if (img) setViewing({ src: largeCover(img), alt: '대표 사진', from: img });
							}}
						>
							<HeightAutoImg src={articleImage} fallback={fallbackImage} height={'auto'} />
						</button>
					</div>
				)
			)}
			<article className="np-articles-article-content-newsletter-content">
				{/* 방문 통계 (#131): 본문의 브리핑 · 소식을 구역으로 센다 */}
				{/* 클릭 · 키는 소식 사진(role="button"으로 바꿔 둠)만 받는다 */}
				<div
					ref={bodyRef}
					data-track-content
					onClick={(e) => openImage(e.target)}
					onKeyDown={(e) => {
						if ((e.key === 'Enter' || e.key === ' ') && openImage(e.target)) e.preventDefault();
					}}
					dangerouslySetInnerHTML={html}
				/>
				<ImageViewer image={viewing} onClose={() => setViewing(null)} />
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
