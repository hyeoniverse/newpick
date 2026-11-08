'use client';

import { LuChevronDown, LuLoaderCircle } from 'react-icons/lu';
import { cx } from '@/styles/tw';

interface Props {
	/** 아직 안 불러온 수 */
	remaining: number;
	loading: boolean;
	onClick: () => void;
}

/** 목록 끝 '더 보기 (N개 남음)': 북마크 · 스크랩을 한 쪽씩 이어 붙인다. 다 불러오면 그리지 않는다 */
export default function LoadMore({ remaining, loading, onClick }: Props) {
	if (remaining <= 0) return null;
	return (
		<StyledLoadMore type="button" onClick={onClick} disabled={loading} aria-busy={loading || undefined}>
			{loading ? <LuLoaderCircle className="spin" aria-hidden /> : <LuChevronDown aria-hidden />}더 보기{' '}
			<span className="left">{remaining.toLocaleString()}개 남음</span>
		</StyledLoadMore>
	);
}

const StyledLoadMore = ({ className, ...props }: React.ComponentProps<'button'>) => (
	<button className={cx('np-mypage-load-more-load-more', className)} {...props} />
);
