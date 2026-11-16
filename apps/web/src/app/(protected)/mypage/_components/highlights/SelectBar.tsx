'use client';

import { ACTIONS } from '@/copy';
import InputCheck from '@/components/common/InputCheck';
import { useLiftScrollButtons } from '@/components/common/ScrollButtons';
import FolderMenu from '../folders/FolderMenu';
import type { HighlightSelection } from './useHighlightSelection';

/** 고르는 중: 아래에 붙어 따라오는 막대. 전체 선택 · 고른 수 · 한꺼번에 할 일 (모바일은 한 줄로 옆으로 밀어 본다) */
export default function SelectBar({ selection, shownCount }: { selection: HighlightSelection; shownCount: number }) {
	// 막대가 바닥에 붙어 있는 동안 위·아래 스크롤 버튼을 그 위로
	const liftScrollButtons = useLiftScrollButtons();
	const { selected, allShownSelected } = selection;
	const none = selected.size === 0;

	return (
		<div ref={liftScrollButtons} className="select-bar" role="region" aria-label="선택한 문장 한꺼번에">
			<InputCheck
				name="highlights-select-all"
				className="pick-all"
				size="small"
				label={allShownSelected ? '전체 해제' : `전체 선택 (${shownCount})`}
				checked={allShownSelected}
				onCheckedChange={selection.toggleAll}
			/>
			<span className="picked">{selected.size}개 선택</span>
			<div className="bulk">
				<FolderMenu label="폴더로 옮기기" up disabled={none} onPick={selection.move} />
				<button type="button" disabled={none} onClick={selection.star}>
					중요 표시
				</button>
				<button type="button" disabled={none} onClick={selection.unstar}>
					중요 해제
				</button>
				<button type="button" disabled={none} onClick={selection.copy}>
					복사
				</button>
				<button type="button" onClick={selection.stop}>
					{ACTIONS.cancel}
				</button>
				<button type="button" className="danger" disabled={none} onClick={selection.removePicked}>
					{selected.size}개 지우기
				</button>
			</div>
		</div>
	);
}
