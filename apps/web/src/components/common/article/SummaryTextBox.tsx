import { summaryItems } from '@/utils/summaryItems';
import { cx } from '@/styles/tw';

interface Props {
	flex?: number;
	children?: React.ReactNode;
	className?: string;
	/** 제목 단계: 상세는 기사 제목(h1) 바로 아래라 h2, 마이페이지는 뉴스레터 제목(h2) 아래라 h3 (#16) */
	headingAs?: 'h2' | 'h3';
}

/** AI 요약. 글(문자열)이면 문장마다 한 줄씩 목록으로 (소식별), 한 문장뿐이면 문단 그대로 */
function SummaryTextBox({ children, className, flex, headingAs: Heading = 'h2' }: Props) {
	const items = typeof children === 'string' ? summaryItems(children) : [];
	return (
		<div
			className={cx(
				'h-auto flex-[var(--summary-flex,1)] rounded-surface border border-solid border-border bg-surface p-5',
				className,
			)}
			style={{ '--summary-flex': flex } as React.CSSProperties}
			data-track-section="summary"
		>
			<Heading className="mb-2 text-small font-bold">AI 요약</Heading>
			{items.length > 1 ? (
				// 글머리 점은 직접 그린다 (사이트 공통 CSS가 목록 점을 지운다)
				<ul className="m-0 flex list-none flex-col gap-2 p-0 text-medium-grey [word-break:keep-all]">
					{items.map((item, i) => (
						<li
							key={i}
							className="relative m-0 pl-4 leading-[1.6] before:absolute before:top-[0.7em] before:left-0.5 before:size-[0.3125rem] before:rounded-full before:bg-primary before:content-['']"
						>
							{item}
						</li>
					))}
				</ul>
			) : (
				// 요약은 소식마다 한 문단, 문단 사이 빈 줄 (#41)
				<p className="whitespace-pre-line text-medium-grey">{children}</p>
			)}
		</div>
	);
}

export default SummaryTextBox;
