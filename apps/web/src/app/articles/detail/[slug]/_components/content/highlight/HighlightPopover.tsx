'use client';

import { ACTIONS, LOGIN } from '@/copy';
import { createPortal } from 'react-dom';
import { LuHighlighter, LuMessageSquarePlus, LuTrash2 } from 'react-icons/lu';
import { useAuth } from '@/hooks/useAuth';
import { useOpenLogin } from '@/hooks/useOpenLogin';
import { useHighlightMutations } from '@/hooks/useHighlights';
import { useConfirmRemoveHighlights } from '@/hooks/useConfirmRemoveHighlights';
import { cx } from '@/styles/tw';
import type { Box } from '../../../_lib/highlightDom';
import type { Picked, Popover } from './useHighlightPopover';

/**
 * 고른 글 · 형광펜의 창 (#198): 도구 막대(스크랩 · 메모) · 새 메모 · 내 스크랩(중요 표시 · 메모 고치기 · 지우기).
 * 데스크톱은 글에 붙이고(문서 좌표라 스크롤하면 글과 함께), 휴대폰은 아래 시트. 본문 스타일이 붙지 않게 body에 띄운다
 */
export default function HighlightPopover({
	newsletterId,
	popover,
	setPopover,
	memo,
	setMemo,
	isMobile,
}: {
	newsletterId: number;
	popover: Popover;
	setPopover: (next: Popover | null) => void;
	memo: string;
	setMemo: (next: string) => void;
	isMobile: boolean;
}) {
	const { user } = useAuth();
	const openLogin = useOpenLogin();
	const { create, update } = useHighlightMutations();
	const confirmRemove = useConfirmRemoveHighlights();
	const close = () => setPopover(null);

	const needLogin = () => {
		openLogin(LOGIN.loginRequired.highlight);
		close();
	};
	const save = (picked: Picked, note?: string) => {
		if (!user) return needLogin();
		create.mutate(
			{ newsletterId, section: picked.section, text: picked.text, ...(note?.trim() && { note: note.trim() }) },
			{ onSuccess: () => window.getSelection()?.removeAllRanges() },
		);
		close();
		setMemo('');
	};

	// 휴대폰에서 메모 · 내 스크랩은 뒤에 오버레이를 깔고 그곳을 누르면 닫는다 (도구 막대는 고른 글이 보이게 깔지 않는다)
	const dim = isMobile && popover.kind !== 'toolbar';

	return createPortal(
		<>
			{dim && <div className="np-articles-highlight-layer-dim" data-highlight-popover aria-hidden onClick={close} />}
			<div
				style={
					isMobile ? undefined : placeNear(popover.kind === 'saved' ? popover.rect : popover.picked.rect, popover.kind)
				}
				className={cx('np-articles-highlight-layer-popover', isMobile ? `sheet ${popover.kind}` : undefined)}
				data-highlight-popover
				role="dialog"
				aria-label="스크랩 · 메모"
			>
				{popover.kind === 'toolbar' && (
					<div className="toolbar">
						<button type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => save(popover.picked)}>
							<LuHighlighter aria-hidden /> 스크랩
						</button>
						<span className="divider" aria-hidden />
						<button
							type="button"
							onMouseDown={(e) => e.preventDefault()}
							onClick={() => (user ? setPopover({ kind: 'memo', picked: popover.picked }) : needLogin())}
						>
							<LuMessageSquarePlus aria-hidden /> 메모
						</button>
					</div>
				)}
				{popover.kind === 'memo' && (
					<form
						className="memo"
						onSubmit={(event) => {
							event.preventDefault();
							save(popover.picked, memo);
						}}
					>
						<blockquote>{popover.picked.text}</blockquote>
						<textarea
							value={memo}
							onChange={(e) => setMemo(e.target.value)}
							placeholder="이 문장에 대한 내 생각"
							rows={3}
							maxLength={2000}
							autoFocus
						/>
						<div className="actions">
							<button type="button" onClick={close}>
								{ACTIONS.cancel}
							</button>
							<button type="submit" className="primary" disabled={!memo.trim()}>
								메모 저장
							</button>
						</div>
					</form>
				)}
				{popover.kind === 'saved' && (
					<form
						className="memo"
						onSubmit={(event) => {
							event.preventDefault();
							update.mutate({ id: popover.highlight.id, note: memo });
							close();
						}}
					>
						<div className="saved-head">
							<p className="label">내 스크랩</p>
							{/* 중요 표시 켜고 끄기 */}
							<button
								type="button"
								className={`star-toggle ${popover.highlight.starred ? 'on' : ''}`}
								aria-pressed={popover.highlight.starred}
								onClick={() => {
									update.mutate({ id: popover.highlight.id, starred: !popover.highlight.starred });
									close();
								}}
							>
								{popover.highlight.starred ? '★ 중요 해제' : '☆ 중요 표시'}
							</button>
						</div>
						<textarea
							value={memo}
							onChange={(e) => setMemo(e.target.value)}
							placeholder="메모 남기기 (선택)"
							rows={3}
							maxLength={2000}
						/>
						<div className="actions">
							<button
								type="button"
								className="danger"
								// 여기서는 바로 지우되, 중요 표시한 문장이면 한 번 더 묻는다
								onClick={() => {
									confirmRemove([popover.highlight], { askFirst: false });
									close();
								}}
							>
								<LuTrash2 aria-hidden /> 스크랩 지우기
							</button>
							<button type="submit" className="primary" disabled={memo === (popover.highlight.note ?? '')}>
								메모 저장
							</button>
						</div>
					</form>
				)}
			</div>
		</>,
		document.body,
	);
}

/**
 * 데스크톱 창 자리: 글에 붙인다 (문서 좌표). 도구 막대는 글 위, 메모 · 내 스크랩은 글 아래.
 * 터치 화면은 도구 막대도 글 아래에 (기기의 기본 복사 메뉴가 위에 뜨므로). 화면 양끝 120px 안쪽으로
 */
function placeNear(rect: Box, kind: Popover['kind']): React.CSSProperties {
	const below = kind !== 'toolbar' || window.matchMedia('(pointer: coarse)').matches;
	return {
		left: Math.min(
			Math.max(rect.left + rect.width / 2, window.scrollX + 120),
			window.scrollX + window.innerWidth - 120,
		),
		top: below ? rect.bottom + 10 : rect.top - 10,
		transform: below ? 'translateX(-50%)' : 'translate(-50%, -100%)',
	};
}
