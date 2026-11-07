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
 * 채우지 않고 얇은 테두리 + 진한 회색 글자: 관심사 · 제목(강조색)과 다투지 않으면서 또렷하게.
 * #만 강조색으로 남겨 태그라는 표시. 링크면 올렸을 때 테두리 · 글자를 강조색으로
 */
const ITEM =
	'm-0 whitespace-nowrap rounded-chip border border-solid border-border bg-transparent px-2 py-px text-extra-small font-medium leading-[1.6] text-medium-grey has-[a]:hover:border-primary has-[a]:hover:text-primary';

/** 뉴스레터 키워드 (#50) */
export default function Tags({ tags, max, className, linkable = false }: Props) {
	const shown = (tags ?? []).slice(0, max);
	if (!shown.length) return null;
	return (
		<ul className={cx('m-0 flex list-none flex-wrap gap-1.5 p-0', className)} aria-label="키워드">
			{shown.map((tag) => (
				<li key={tag} className={ITEM}>
					{linkable ? (
						<Link href={`/articles?keyword=${encodeURIComponent(tag)}`} className="text-inherit">
							<span className="hash mr-px text-primary">#</span>
							{tag}
						</Link>
					) : (
						<>
							<span className="hash mr-px text-primary">#</span>
							{tag}
						</>
					)}
				</li>
			))}
		</ul>
	);
}
