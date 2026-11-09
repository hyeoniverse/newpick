import { ROUTES } from '@/constants/routes';
import Link from 'next/link';
import HeightAutoImg from '@/components/common/HeightAutoImg';
import { dateFormatter } from '@/utils/formatter';
import { getFirstImage } from '@/utils/getFirstImage';
import { usePopularArticlesQuery } from '@/hooks/useArticle';
import { SkeletonBlock } from '@/components/common/loader/Skeleton';
import { cx } from '@/styles/tw';

interface Props {
	flex?: number;
	className?: string;
}

function PopularArticle({ className }: Props) {
	const { data: popularArticles, isPending, isError, refetch } = usePopularArticlesQuery();

	return (
		<div
			className={cx('np-articles-popular-article-popular-newsletter', className)}
			data-track-section="detail-popular"
		>
			<h3 className="section-title">지금 인기 뉴스레터 TOP 5</h3>
			{/* 불러오는 중 · 실패 · 비어 있음 (#17). 옆 칸이라 작게 */}
			{isPending && (
				<ul className="popular-list" aria-hidden>
					{Array.from({ length: 5 }).map((_, index) => (
						<li key={index} className="skeleton">
							<SkeletonBlock $width="1rem" $height="1rem" />
							<span className="skeleton-text">
								<SkeletonBlock $width="90%" />
								<SkeletonBlock $width="40%" $height="0.75rem" />
							</span>
							<SkeletonBlock $width="3.25rem" $height="3.25rem" $radius="8px" />
						</li>
					))}
				</ul>
			)}
			{isError && (
				<p className="state">
					인기 뉴스레터를 불러오지 못했어요.{' '}
					<button type="button" className="retry" onClick={() => refetch()}>
						다시 시도
					</button>
				</p>
			)}
			{popularArticles?.length === 0 && <p className="state">아직 인기 뉴스레터가 없어요.</p>}
			<ul className="popular-list" hidden={!popularArticles?.length}>
				{popularArticles &&
					popularArticles.map((article, index) => (
						<li key={index}>
							<p className="index">{index + 1}</p>
							<Link href={ROUTES.article(article.id)} className="text-section">
								<div>
									<p className="title">{article.title}</p>
									<p className="date">{dateFormatter(article.createdAt)}</p>
								</div>
							</Link>
							{article.imageUrl ? (
								<Link href={ROUTES.article(article.id)} className="thum-link">
									<HeightAutoImg src={getFirstImage(article.imageUrl)} aspectratio={1} />
								</Link>
							) : (
								<div className="thum-empty" />
							)}
						</li>
					))}
			</ul>
		</div>
	);
}

export default PopularArticle;
