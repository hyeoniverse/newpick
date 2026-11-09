import Link from 'next/link';
import { cx } from '@/styles/tw';

interface Props {
	tags?: string[] | null;
	/** 목록 카드처럼 좁은 곳에서는 앞의 몇 개만 */
	max?: number;
	className?: string;
	/** 누르면 같은 키워드의 뉴스레터 목록으로 (#20). 카드처럼 이미 링크 안에 있으면 끈다(링크 안에 링크 금지) */
	linkable?: boolean;
}

/*
 * 모양은 styles/parts.css (.np-tags): 화면 CSS가 덮어쓸 수 있게 components 층에 둔다.
 * 채우지 않고 얇은 테두리 + 진한 회색 글자: 관심사 · 제목(강조색)과 다투지 않으면서 또렷하게.
 * #만 강조색으로 남겨 태그라는 표시. 링크면 올렸을 때 테두리 · 글자를 강조색으로
 */

/** 뉴스레터 키워드 (#50) */
export default function Tags({ tags, max, className, linkable = false }: Props) {
	const shown = (tags ?? []).slice(0, max);
	if (!shown.length) return null;
	return (
		<ul className={cx('np-tags', className)} aria-label="키워드">
			{shown.map((tag) => (
				<li key={tag} className="np-tags-chip">
					{linkable ? (
						<Link href={`/articles?keyword=${encodeURIComponent(tag)}`} className="np-tags-link">
							<span className="hash">#</span>
							{tag}
						</Link>
					) : (
						<>
							<span className="hash">#</span>
							{tag}
						</>
					)}
				</li>
			))}
		</ul>
	);
}
