import { LuChevronRight } from 'react-icons/lu';
import { summaryItems } from '@/utils/summaryItems';
import { cx } from '@/styles/tw';

/** 본문 소식 (상세: 본문 HTML에서 꺼낸 것). 제목과 리드(그 소식의 핵심 한 문장)를 그대로 보여 준다 */
export interface SummaryStory {
	kicker: string;
	heading: string;
	lead: string;
	morning: boolean;
}

interface Props {
	flex?: number;
	children?: React.ReactNode;
	className?: string;
	/** 제목 단계: 상세는 기사 제목(h1) 바로 아래라 h2, 마이페이지는 뉴스레터 제목(h2) 아래라 h3 (#16) */
	headingAs?: 'h2' | 'h3';
	/**
	 * 본문 소식. 둘 이상이고 모두 리드가 있으면 소식마다 번호 · 꼬리표 · 제목(굵게) · 리드로 보여 주고,
	 * 누르면 본문의 그 소식으로 간다. 요약 글의 문장 순서는 소식 순서와 어긋날 때가 있어 짝짓지 않는다.
	 * 없으면 요약 글을 문장 목록으로
	 */
	stories?: SummaryStory[];
	/** 누르면 갈 본문 소식들 (본문 순서). 상세 본문의 article.story */
	storySelector?: string;
}

/** 요약 문장 속 ==핵심 구절==은 형광펜으로 */
function Marked({ text }: { text: string }) {
	const parts = text.split(/==(.+?)==/g);
	return (
		<>
			{parts.map((part, i) =>
				i % 2 ? (
					<mark key={i} className="rounded-[2px] bg-tertiary px-0.5 font-semi-bold text-text">
						{part}
					</mark>
				) : (
					part
				),
			)}
		</>
	);
}

/**
 * 본문의 i번째 소식으로 (움직임 줄이기 설정이면 바로).
 * 스크롤하는 동안 본문이 다시 그려지기도 하고(요소가 바뀐다) 위쪽 사진이 늦게 불러와져 소식이 아래로 밀리기도 해서,
 * 다 간 뒤 3초 동안 0.1초마다 그 소식을 다시 찾아 자리를 맞춘다 (사용자가 스크롤하면 그만)
 */
function goToStory(selector: string, index: number) {
	const find = () => document.querySelectorAll<HTMLElement>(selector)[index];
	const first = find();
	if (!first) return;
	const still = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
	first.scrollIntoView({ behavior: still ? 'auto' : 'smooth', block: 'start' });

	// 사이트 전체가 scroll-behavior: smooth라 맞출 때는 'instant'로 (auto면 또 천천히 움직이다 다시 어긋난다)
	const settle = () => {
		const target = find();
		if (!target) return;
		const margin = parseFloat(getComputedStyle(target).scrollMarginTop) || 0;
		if (Math.abs(target.getBoundingClientRect().top - margin) > 8) {
			target.scrollIntoView({ behavior: 'instant', block: 'start' });
		}
	};
	let timer = 0;
	const stop = () => {
		window.clearInterval(timer);
		window.removeEventListener('wheel', stop);
		window.removeEventListener('touchstart', stop);
		window.removeEventListener('keydown', stop);
	};
	window.addEventListener('wheel', stop, { passive: true });
	window.addEventListener('touchstart', stop, { passive: true });
	window.addEventListener('keydown', stop);
	// 부드럽게 가는 동안은 건드리지 않는다
	window.setTimeout(
		() => {
			timer = window.setInterval(settle, 100);
			window.setTimeout(stop, 3000);
		},
		still ? 0 : 900,
	);
}

/**
 * AI 요약. 소식 구조가 있으면 소식마다 한 줄 (번호 · 꼬리표 · 제목 · 리드, 누르면 그 소식으로),
 * 없으면(예전 뉴스레터) 요약 글을 문장마다 한 줄 목록, 한 문장뿐이면 문단 그대로
 */
function SummaryTextBox({
	children,
	className,
	flex,
	headingAs: Heading = 'h2',
	stories = [],
	storySelector = '.np-articles-article-content-newsletter-content article.story',
}: Props) {
	const items = typeof children === 'string' ? summaryItems(children) : [];
	const paired = stories.length > 1 && stories.every((story) => story.lead);
	return (
		<div
			className={cx(
				'h-auto flex-[var(--summary-flex,1)] rounded-surface border border-solid border-border bg-surface p-5',
				className,
			)}
			style={{ '--summary-flex': flex } as React.CSSProperties}
			data-track-section="summary"
		>
			<div className="mb-3 flex items-baseline justify-between gap-3">
				<Heading className="m-0 text-small font-bold">AI 요약</Heading>
				{paired && <span className="text-extra-small text-sub-text">오늘의 소식 {stories.length}개</span>}
			</div>
			{paired ? (
				<ol className="m-0 flex list-none flex-col p-0 [word-break:keep-all]">
					{stories.map((story, i) => (
						<li key={i} className="m-0 border-0 border-t border-solid border-border first:border-t-0">
							<button
								type="button"
								onClick={() => goToStory(storySelector, i)}
								className="group grid w-full cursor-pointer grid-cols-[2rem_minmax(0,1fr)_1rem] items-start gap-x-3 border-0 bg-transparent px-0 py-3 text-left text-inherit"
							>
								<span className="pt-0.5 text-small font-extra-bold tabular-nums text-primary">
									{String(i + 1).padStart(2, '0')}
								</span>
								<span className="flex min-w-0 flex-col gap-1">
									<span className="flex flex-wrap items-center gap-1.5">
										{story.morning && (
											<span className="rounded-chip bg-primary px-2 py-px text-extra-small font-semi-bold text-[#ffffff]">
												아침 속보
											</span>
										)}
										{story.kicker && (
											<span className="rounded-chip bg-tertiary px-2 py-px text-extra-small font-semi-bold text-primary">
												{story.kicker}
											</span>
										)}
									</span>
									<strong className="text-medium font-bold leading-[1.45] text-text group-hover:text-primary">
										{story.heading}
									</strong>
									<span className="text-small leading-[1.6] text-sub-text">{story.lead}</span>
								</span>
								<LuChevronRight
									aria-hidden
									className="mt-1 size-4 text-sub-text transition-transform group-hover:translate-x-0.5 group-hover:text-primary motion-reduce:transition-none"
								/>
							</button>
						</li>
					))}
				</ol>
			) : items.length > 1 ? (
				// 글머리 점은 직접 그린다 (사이트 공통 CSS가 목록 점을 지운다)
				<ul className="m-0 flex list-none flex-col gap-2 p-0 text-medium-grey [word-break:keep-all]">
					{items.map((item, i) => (
						<li
							key={i}
							className="relative m-0 pl-4 leading-[1.6] before:absolute before:top-[0.7em] before:left-0.5 before:size-[0.3125rem] before:rounded-full before:bg-primary before:content-['']"
						>
							<Marked text={item} />
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
