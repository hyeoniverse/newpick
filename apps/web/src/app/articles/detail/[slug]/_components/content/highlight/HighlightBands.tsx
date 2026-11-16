import type { Band } from '../../../_lib/highlightDom';

/**
 * 형광펜 띠: 본문 글자 뒤(z-index -1, 본문 틀이 isolation으로 따로 쌓임)에 깐다. 누르기는 본문이 받는다.
 * 스크랩은 옅은 주 색, 메모가 있으면 아래에 주 색 줄, 마이페이지에서 온 문장은 잠깐 진하게.
 * 본문 뒤에 따로 그려 본문 HTML(React가 그린 것)을 건드리지 않는다
 */
export default function HighlightBands({
	layerRef,
	bands,
	focusId,
}: {
	layerRef: React.Ref<HTMLDivElement>;
	bands: Band[];
	focusId: number | null;
}) {
	return (
		<div className="np-articles-highlight-layer-bands" ref={layerRef} aria-hidden>
			{bands.map((band, i) => (
				<span
					key={`${band.id}-${i}`}
					className={`${band.note ? 'note' : ''} ${band.id === focusId ? 'focus' : ''}`}
					style={{ left: band.left, top: band.top, width: band.width, height: band.height }}
				/>
			))}
		</div>
	);
}
