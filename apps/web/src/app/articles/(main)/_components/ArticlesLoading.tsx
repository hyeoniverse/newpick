'use client';

import { SkeletonBlock } from '@/components/common/loader/Skeleton';
import { cx } from '@/styles/tw';

/**
 * 뉴스레터 목록을 서버에서 그리는 동안 (#17). 관심사를 바꿀 때마다 요청마다 새로 그리므로,
 * 빈 화면 대신 실제 모양(관심사 칩 · 제목 · 오늘의 톱 카드 · 목록)대로 자리를 채운다
 */
export default function ArticlesLoading() {
	return (
		<StyledLoading aria-busy aria-label="뉴스레터를 불러오는 중">
			<div className="chips" aria-hidden>
				{Array.from({ length: 7 }).map((_, index) => (
					<SkeletonBlock key={index} $width="3.5rem" $height="2.125rem" />
				))}
			</div>
			<div className="intro" aria-hidden>
				<SkeletonBlock $width="14rem" $height="2.25rem" $radius="8px" />
				<SkeletonBlock $width="20rem" $height="1.125rem" />
			</div>
			<div className="stage" aria-hidden>
				<SkeletonBlock $height="100%" $radius="8px" />
				<div className="stage-text">
					<SkeletonBlock $width="3rem" />
					<SkeletonBlock $width="85%" $height="1.75rem" />
					<SkeletonBlock $width="70%" />
					<SkeletonBlock $width="60%" />
				</div>
			</div>
			<div className="list" aria-hidden>
				{Array.from({ length: 6 }).map((_, index) => (
					<div key={index} className="item">
						<SkeletonBlock $height="9rem" $radius="8px" />
						<SkeletonBlock $width="85%" />
						<SkeletonBlock $width="50%" $height="0.75rem" />
					</div>
				))}
			</div>
		</StyledLoading>
	);
}

const StyledLoading = ({ className, ...props }: React.ComponentProps<'div'>) => (
	<div className={cx('np-articles-articles-loading-loading', className)} {...props} />
);
