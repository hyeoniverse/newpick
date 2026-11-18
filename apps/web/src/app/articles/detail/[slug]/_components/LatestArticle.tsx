import dynamic from 'next/dynamic';
import { useArticleListQuery } from '@/hooks/useArticle';
import { SkeletonBlock } from '@/components/common/loader/Skeleton';
import { cx } from '@/styles/tw';

/** 사진 카드 띠 (#17)의 높이 자리 */
const Skeleton = () => (
	<div className="skeleton-row" aria-hidden>
		{Array.from({ length: 3 }).map((_, index) => (
			<SkeletonBlock key={index} $height="12rem" $radius="8px" />
		))}
	</div>
);

// Swiper(약 23 KB)는 본문 아래 이 띠만 쓴다. 첫 JS에서 빼고 그릴 때 받는다 (#292)
const LatestSlider = dynamic(() => import('./LatestSlider'), { ssr: false, loading: Skeleton });

interface Props {
	className?: string;
}

/**
 * 최신 뉴스레터: 화면 폭 전체 어두운 띠 위 사진 카드 슬라이드. 사진을 카드 전체로 깔고 아래쪽을 어둡게 해 그 위에 관심사 · 날짜 · 제목
 */
function LatestArticle({ className }: Props) {
	const { data: articleList, isPending, isError } = useArticleListQuery();

	// 본문 아래 덧붙이는 띠라, 실패하거나 비면 띠째 감춘다 (#17)
	if (isError || articleList?.length === 0) return null;

	return (
		<section
			className={cx('np-articles-latest-article-latest-article', className)}
			aria-busy={isPending || undefined}
			data-track-section="detail-latest"
		>
			<div className="section-title">
				<h3>최신 뉴스레터</h3>
				<div className="arrow">
					<button type="button" className="latest-prev" aria-label="이전 뉴스레터들" />
					<button type="button" className="latest-next" aria-label="다음 뉴스레터들" />
				</div>
			</div>
			{isPending ? <Skeleton /> : <LatestSlider articles={articleList ?? []} />}
		</section>
	);
}

export default LatestArticle;
