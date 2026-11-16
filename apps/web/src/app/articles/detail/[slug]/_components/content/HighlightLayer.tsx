'use client';

import type { Highlight } from '@newpick/shared';
import { useHighlights } from '@/hooks/useHighlights';
import HighlightBands from './highlight/HighlightBands';
import HighlightPopover from './highlight/HighlightPopover';
import { useHighlightBands } from './highlight/useHighlightBands';
import { useHighlightPopover } from './highlight/useHighlightPopover';

interface Props {
	newsletterId: number;
	/** 뉴스레터 본문 (저장된 HTML이 들어 있는 곳) */
	rootRef: React.RefObject<HTMLElement | null>;
}

/** 스크랩이 없을 때(비로그인 · 불러오는 중) 쓰는 빈 목록. 렌더마다 새 []를 만들면 칠하기 효과가 끝없이 돈다 */
const NO_HIGHLIGHTS: Highlight[] = [];

/**
 * 스크랩 · 메모 (#123 1단계): 본문에서 문장을 고르면 작은 도구 막대(스크랩 · 메모),
 * 저장한 문장은 형광펜(메모가 있으면 밑줄도)으로 다시 칠하고, 누르면 메모 보기 · 고치기 · 지우기.
 * 형광펜은 본문 뒤에 띠를 따로 그려 본문 HTML(React가 그린 것)을 건드리지 않는다.
 * 마이페이지에서 '원문에서 보기'로 오면(?hl=번호) 그 문장으로 스크롤한다
 *
 * 이 파일은 조립만 (#198): 칠하기 useHighlightBands · 고르기/누르기 useHighlightPopover,
 * DOM 계산 _lib/highlightDom, 그림은 highlight/의 HighlightBands · HighlightPopover
 */
export default function HighlightLayer({ newsletterId, rootRef }: Props) {
	const { data: highlights = NO_HIGHLIGHTS } = useHighlights(newsletterId);
	const { layerRef, bands, focusId, ranges } = useHighlightBands(rootRef, highlights);
	const { popover, setPopover, memo, setMemo, isMobile } = useHighlightPopover(rootRef, highlights, ranges);

	return (
		<>
			<HighlightBands layerRef={layerRef} bands={bands} focusId={focusId} />
			{popover && (
				<HighlightPopover
					newsletterId={newsletterId}
					popover={popover}
					setPopover={setPopover}
					memo={memo}
					setMemo={setMemo}
					isMobile={isMobile}
				/>
			)}
		</>
	);
}
